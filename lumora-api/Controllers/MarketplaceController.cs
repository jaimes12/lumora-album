using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/marketplace")]
public class MarketplaceController(LumoraDbContext db) : ControllerBase
{
    [HttpGet("trips")]
    public async Task<IActionResult> GetTrips([FromQuery] string? destino)
    {
        var q = db.Trips.Where(t => t.IsPublic && t.Status != "cancelado" && t.DepartureDate >= DateTime.UtcNow.Date);
        if (!string.IsNullOrWhiteSpace(destino))
            q = q.Where(t => t.Destination.Contains(destino) || t.Name.Contains(destino));

        var trips = await q.OrderBy(t => t.DepartureDate).ToListAsync();
        if (trips.Count == 0) return Ok(Array.Empty<MarketplaceTripSummary>());

        var orgIds = trips.Select(t => t.OrgId).Distinct().ToList();
        var orgs = await db.Organizations
            .Where(o => orgIds.Contains(o.Id) && o.Industry == "travel" && !o.Disabled)
            .ToDictionaryAsync(o => o.Id);
        trips = trips.Where(t => orgs.ContainsKey(t.OrgId)).ToList();
        if (trips.Count == 0) return Ok(Array.Empty<MarketplaceTripSummary>());

        var validOrgIds = trips.Select(t => t.OrgId).Distinct().ToList();
        var settings = await db.OrgSettings.Where(s => validOrgIds.Contains(s.OrgId)).ToDictionaryAsync(s => s.OrgId);

        var tripIds = trips.Select(t => t.Id).ToList();
        var coverPhotos = await db.TripPhotos
            .Where(p => tripIds.Contains(p.TripId))
            .OrderBy(p => p.SortOrder).ThenBy(p => p.CreatedAt)
            .GroupBy(p => p.TripId)
            .Select(g => new { TripId = g.Key, Url = g.First().Url })
            .ToDictionaryAsync(x => x.TripId, x => x.Url);

        var passengerStats = await db.TripPassengers
            .Where(p => tripIds.Contains(p.TripId))
            .GroupBy(p => p.TripId)
            .Select(g => new { TripId = g.Key, Seats = g.Sum(p => p.Seats) })
            .ToDictionaryAsync(x => x.TripId, x => x.Seats);

        return Ok(trips.Select(t => {
            var org = orgs[t.OrgId];
            var cfg = settings.GetValueOrDefault(t.OrgId);
            var agencyName = !string.IsNullOrWhiteSpace(cfg?.CompanyName) ? cfg!.CompanyName : org.Name;
            return new MarketplaceTripSummary(
                t.Id, string.IsNullOrWhiteSpace(t.PostTitle) ? t.Name : t.PostTitle, t.Destination, t.DepartureDate, t.ReturnDate,
                t.PricePerPerson, t.SeatsTotal, passengerStats.GetValueOrDefault(t.Id),
                coverPhotos.GetValueOrDefault(t.Id),
                agencyName, string.IsNullOrWhiteSpace(cfg?.City) ? null : cfg!.City,
                t.OfferPrice
            );
        }));
    }

    [HttpGet("trips/{id}")]
    public async Task<IActionResult> GetTrip(string id)
    {
        var trip = await db.Trips.FirstOrDefaultAsync(t => t.Id == id && t.IsPublic && t.Status != "cancelado");
        if (trip is null) return NotFound();

        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == trip.OrgId && o.Industry == "travel" && !o.Disabled);
        if (org is null) return NotFound();

        var cfg = await db.OrgSettings.FirstOrDefaultAsync(s => s.OrgId == trip.OrgId);
        var agencyName = !string.IsNullOrWhiteSpace(cfg?.CompanyName) ? cfg!.CompanyName : org.Name;

        var photos = await db.TripPhotos
            .Where(p => p.TripId == id)
            .OrderBy(p => p.SortOrder).ThenBy(p => p.CreatedAt)
            .Select(p => new TripPhotoInfo(p.Id, p.TripId, p.Url, p.Caption, p.CreatedAt, p.SortOrder))
            .ToListAsync();

        var seatsTaken = await db.TripPassengers.Where(p => p.TripId == id).SumAsync(p => (int?)p.Seats) ?? 0;

        var includes = (trip.Includes ?? "")
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        return Ok(new MarketplaceTripDetail(
            trip.Id, string.IsNullOrWhiteSpace(trip.PostTitle) ? trip.Name : trip.PostTitle, trip.Destination, trip.DepartureDate, trip.ReturnDate,
            trip.PricePerPerson, trip.SeatsTotal, seatsTaken,
            trip.Description, photos,
            agencyName,
            string.IsNullOrWhiteSpace(cfg?.City) ? null : cfg!.City,
            string.IsNullOrWhiteSpace(cfg?.Phone) ? null : cfg!.Phone,
            string.IsNullOrWhiteSpace(cfg?.Email) ? null : cfg!.Email,
            includes,
            trip.Location, trip.OfferPrice
        ));
    }

    [HttpPost("trips/{id}/inquiries")]
    public async Task<IActionResult> SendInquiry(string id, [FromBody] MarketplaceInquiryRequest req)
    {
        var trip = await db.Trips.FirstOrDefaultAsync(t => t.Id == id && t.IsPublic && t.Status != "cancelado");
        if (trip is null) return NotFound();

        var orgValid = await db.Organizations.AnyAsync(o => o.Id == trip.OrgId && o.Industry == "travel" && !o.Disabled);
        if (!orgValid) return NotFound();

        var lead = new Lead {
            Id            = Guid.NewGuid().ToString(),
            OrgId         = trip.OrgId,
            Name          = req.Name.Trim(),
            Phone         = req.Phone.Trim(),
            EventType     = $"Viaje: {trip.Destination}",
            LastMessage   = req.Message.Trim(),
            Stage         = "nuevo",
            CreatedAt     = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
            Source        = "marketplace",
        };
        await db.Leads.AddAsync(lead);
        await db.SaveChangesAsync();

        return StatusCode(201, new { ok = true });
    }
}
