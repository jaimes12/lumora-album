using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/trips")]
[Authorize]
public class TripsController(LumoraDbContext db) : ControllerBase
{
    private string OrgId   => User.FindFirst("org_id")?.Value   ?? string.Empty;
    private string? UserId => User.FindFirst("user_id")?.Value;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var q = db.Trips.Where(t => t.OrgId == OrgId);
        if (status is not null) q = q.Where(t => t.Status == status);
        var trips = await q.OrderByDescending(t => t.DepartureDate).ToListAsync();

        var tripIds = trips.Select(t => t.Id).ToList();
        var passengerStats = await db.TripPassengers
            .Where(p => tripIds.Contains(p.TripId))
            .GroupBy(p => p.TripId)
            .Select(g => new { TripId = g.Key, Count = g.Count(), Seats = g.Sum(p => p.Seats) })
            .ToDictionaryAsync(x => x.TripId);

        var paymentStats = await db.TripPayments
            .Where(p => tripIds.Contains(p.TripId))
            .GroupBy(p => p.TripId)
            .Select(g => new { TripId = g.Key, Total = g.Sum(p => p.Amount) })
            .ToDictionaryAsync(x => x.TripId);

        var creatorIds = trips.Select(t => t.CreatedById).Where(x => x != null).Distinct().ToList();
        var creators = await db.Users
            .Where(u => creatorIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name })
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        return Ok(trips.Select(t => {
            var ps = passengerStats.GetValueOrDefault(t.Id);
            var py = paymentStats.GetValueOrDefault(t.Id);
            return new TripResponse(
                t.Id, t.Name, t.Destination, t.Status,
                t.DepartureDate, t.ReturnDate,
                t.PricePerPerson, t.SeatsTotal,
                t.Notes, t.CreatedAt,
                ps?.Count ?? 0, ps?.Seats ?? 0,
                py?.Total ?? 0,
                t.CreatedById is not null && creators.TryGetValue(t.CreatedById, out var cn) ? cn : null
            );
        }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var trip = await db.Trips.FirstOrDefaultAsync(t => t.Id == id && t.OrgId == OrgId);
        if (trip is null) return NotFound();

        var passengers = await db.TripPassengers
            .Where(p => p.TripId == id)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();

        var passengerIds = passengers.Select(p => p.Id).ToList();
        var payments = await db.TripPayments
            .Where(p => passengerIds.Contains(p.PassengerId))
            .OrderBy(p => p.PaidAt)
            .ToListAsync();

        var clientIds = passengers.Select(p => p.ClientId).Distinct().ToList();
        var clients = await db.Clients
            .Where(c => clientIds.Contains(c.Id))
            .Select(c => new { c.Id, c.Name, c.Phone })
            .ToDictionaryAsync(c => c.Id);

        string? createdByName = null;
        if (trip.CreatedById is not null)
            createdByName = await db.Users.Where(u => u.Id == trip.CreatedById).Select(u => u.Name).FirstOrDefaultAsync();

        var passengerList = passengers.Select(p => {
            var cl = clients.GetValueOrDefault(p.ClientId);
            var pPays = payments.Where(x => x.PassengerId == p.Id).ToList();
            var paid = pPays.Sum(x => x.Amount);
            return new PassengerInfo(
                p.Id, p.ClientId, cl?.Name, cl?.Phone,
                p.Seats, p.TotalCost, paid, p.TotalCost - paid,
                p.Status, p.Notes, p.CreatedAt,
                pPays.Select(x => new TripPaymentInfo(x.Id, x.PassengerId, x.Concept, x.Amount, x.Method, x.PaidAt)).ToList()
            );
        }).ToList();

        var expenses = await db.TripExpenses
            .Where(e => e.TripId == id && e.OrgId == OrgId)
            .OrderBy(e => e.CreatedAt)
            .Select(e => new TripExpenseInfo(e.Id, e.Concept, e.Amount, e.Paid, e.Notes, e.CreatedAt))
            .ToListAsync();

        return Ok(new TripDetailResponse(
            trip.Id, trip.Name, trip.Destination, trip.Status,
            trip.DepartureDate, trip.ReturnDate,
            trip.PricePerPerson, trip.SeatsTotal,
            trip.Notes, trip.CreatedAt, passengerList, createdByName, expenses
        ));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTripRequest req)
    {
        var trip = new Trip {
            Id = Guid.NewGuid().ToString(),
            OrgId = OrgId,
            Name = req.Name,
            Destination = req.Destination,
            DepartureDate = req.DepartureDate.ToUniversalTime(),
            ReturnDate = req.ReturnDate.ToUniversalTime(),
            PricePerPerson = req.PricePerPerson,
            SeatsTotal = req.SeatsTotal,
            Notes = req.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedById = UserId,
        };
        await db.Trips.AddAsync(trip);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = trip.Id },
            new TripResponse(trip.Id, trip.Name, trip.Destination, trip.Status,
                trip.DepartureDate, trip.ReturnDate, trip.PricePerPerson, trip.SeatsTotal,
                trip.Notes, trip.CreatedAt, 0, 0, 0, null));
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateTripRequest req)
    {
        var trip = await db.Trips.FirstOrDefaultAsync(t => t.Id == id && t.OrgId == OrgId);
        if (trip is null) return NotFound();
        if (req.Name is not null)             trip.Name          = req.Name;
        if (req.Destination is not null)      trip.Destination   = req.Destination;
        if (req.Status is not null)           trip.Status        = req.Status;
        if (req.Notes is not null)            trip.Notes         = req.Notes;
        if (req.DepartureDate.HasValue)       trip.DepartureDate = req.DepartureDate.Value.ToUniversalTime();
        if (req.ReturnDate.HasValue)          trip.ReturnDate    = req.ReturnDate.Value.ToUniversalTime();
        if (req.PricePerPerson.HasValue)      trip.PricePerPerson = req.PricePerPerson.Value;
        if (req.SeatsTotal.HasValue)          trip.SeatsTotal    = req.SeatsTotal.Value;
        await db.SaveChangesAsync();
        return Ok(await GetTripResponse(trip));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var trip = await db.Trips.FirstOrDefaultAsync(t => t.Id == id && t.OrgId == OrgId);
        if (trip is null) return NotFound();
        db.Trips.Remove(trip);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Passengers ──────────────────────────────────────────────────────────

    [HttpPost("{tripId}/passengers")]
    public async Task<IActionResult> AddPassenger(string tripId, [FromBody] AddPassengerRequest req)
    {
        var trip = await db.Trips.FirstOrDefaultAsync(t => t.Id == tripId && t.OrgId == OrgId);
        if (trip is null) return NotFound();
        var passenger = new TripPassenger {
            Id = Guid.NewGuid().ToString(),
            TripId = tripId,
            OrgId = OrgId,
            ClientId = req.ClientId,
            Seats = req.Seats,
            TotalCost = req.TotalCost ?? trip.PricePerPerson * req.Seats,
            Notes = req.Notes,
            CreatedAt = DateTime.UtcNow,
        };
        await db.TripPassengers.AddAsync(passenger);
        await db.SaveChangesAsync();
        var cl = await db.Clients.Where(c => c.Id == req.ClientId).Select(c => new { c.Name, c.Phone }).FirstOrDefaultAsync();
        return Ok(new PassengerInfo(passenger.Id, passenger.ClientId, cl?.Name, cl?.Phone,
            passenger.Seats, passenger.TotalCost, 0, passenger.TotalCost,
            passenger.Status, passenger.Notes, passenger.CreatedAt, []));
    }

    [HttpPatch("{tripId}/passengers/{passengerId}")]
    public async Task<IActionResult> UpdatePassenger(string tripId, string passengerId, [FromBody] UpdatePassengerRequest req)
    {
        var p = await db.TripPassengers.FirstOrDefaultAsync(x => x.Id == passengerId && x.TripId == tripId && x.OrgId == OrgId);
        if (p is null) return NotFound();
        if (req.Status is not null)      p.Status    = req.Status;
        if (req.Notes  is not null)      p.Notes     = req.Notes;
        if (req.TotalCost.HasValue)      p.TotalCost = req.TotalCost.Value;
        if (req.Seats.HasValue)          p.Seats     = req.Seats.Value;
        await db.SaveChangesAsync();
        return Ok(new { p.Id, p.Status, p.TotalCost, p.Seats });
    }

    [HttpDelete("{tripId}/passengers/{passengerId}")]
    public async Task<IActionResult> RemovePassenger(string tripId, string passengerId)
    {
        var p = await db.TripPassengers.FirstOrDefaultAsync(x => x.Id == passengerId && x.TripId == tripId && x.OrgId == OrgId);
        if (p is null) return NotFound();
        db.TripPassengers.Remove(p);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Payments ─────────────────────────────────────────────────────────────

    [HttpPost("{tripId}/passengers/{passengerId}/payments")]
    public async Task<IActionResult> AddPayment(string tripId, string passengerId, [FromBody] AddTripPaymentRequest req)
    {
        var passenger = await db.TripPassengers.FirstOrDefaultAsync(p => p.Id == passengerId && p.TripId == tripId && p.OrgId == OrgId);
        if (passenger is null) return NotFound();
        var payment = new TripPayment {
            Id = Guid.NewGuid().ToString(),
            TripId = tripId,
            PassengerId = passengerId,
            OrgId = OrgId,
            Concept = req.Concept,
            Amount = req.Amount,
            Method = req.Method,
            PaidAt = req.PaidAt?.ToUniversalTime() ?? DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };
        await db.TripPayments.AddAsync(payment);
        await db.SaveChangesAsync();
        return Ok(new TripPaymentInfo(payment.Id, payment.PassengerId, payment.Concept, payment.Amount, payment.Method, payment.PaidAt));
    }

    [HttpDelete("{tripId}/passengers/{passengerId}/payments/{paymentId}")]
    public async Task<IActionResult> DeletePayment(string tripId, string passengerId, string paymentId)
    {
        var payment = await db.TripPayments.FirstOrDefaultAsync(p => p.Id == paymentId && p.PassengerId == passengerId && p.OrgId == OrgId);
        if (payment is null) return NotFound();
        db.TripPayments.Remove(payment);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Expenses ─────────────────────────────────────────────────────────────

    [HttpGet("{id}/expenses")]
    public async Task<IActionResult> GetExpenses(string id)
    {
        var expenses = await db.TripExpenses
            .Where(e => e.TripId == id && e.OrgId == OrgId)
            .OrderBy(e => e.CreatedAt)
            .Select(e => new TripExpenseInfo(e.Id, e.Concept, e.Amount, e.Paid, e.Notes, e.CreatedAt))
            .ToListAsync();
        return Ok(expenses);
    }

    [HttpPost("{id}/expenses")]
    public async Task<IActionResult> AddExpense(string id, [FromBody] AddTripExpenseRequest req)
    {
        var trip = await db.Trips.FirstOrDefaultAsync(t => t.Id == id && t.OrgId == OrgId);
        if (trip is null) return NotFound();
        var expense = new TripExpense {
            Id = Guid.NewGuid().ToString(),
            TripId = id,
            OrgId = OrgId,
            Concept = req.Concept,
            Amount = req.Amount,
            Paid = req.Paid,
            Notes = req.Notes,
            CreatedAt = DateTime.UtcNow,
        };
        await db.TripExpenses.AddAsync(expense);
        await db.SaveChangesAsync();
        return Ok(new TripExpenseInfo(expense.Id, expense.Concept, expense.Amount, expense.Paid, expense.Notes, expense.CreatedAt));
    }

    [HttpPatch("{id}/expenses/{expenseId}")]
    public async Task<IActionResult> UpdateExpense(string id, string expenseId, [FromBody] UpdateTripExpenseRequest req)
    {
        var expense = await db.TripExpenses.FirstOrDefaultAsync(e => e.Id == expenseId && e.TripId == id && e.OrgId == OrgId);
        if (expense is null) return NotFound();
        if (req.Concept is not null) expense.Concept = req.Concept;
        if (req.Amount.HasValue)    expense.Amount  = req.Amount.Value;
        if (req.Paid.HasValue)      expense.Paid    = req.Paid.Value;
        if (req.Notes is not null)  expense.Notes   = req.Notes;
        await db.SaveChangesAsync();
        return Ok(new TripExpenseInfo(expense.Id, expense.Concept, expense.Amount, expense.Paid, expense.Notes, expense.CreatedAt));
    }

    [HttpDelete("{id}/expenses/{expenseId}")]
    public async Task<IActionResult> DeleteExpense(string id, string expenseId)
    {
        var expense = await db.TripExpenses.FirstOrDefaultAsync(e => e.Id == expenseId && e.TripId == id && e.OrgId == OrgId);
        if (expense is null) return NotFound();
        db.TripExpenses.Remove(expense);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<TripResponse> GetTripResponse(Trip trip)
    {
        var ps = await db.TripPassengers.Where(p => p.TripId == trip.Id).ToListAsync();
        var rev = await db.TripPayments.Where(p => p.TripId == trip.Id).SumAsync(p => (decimal?)p.Amount) ?? 0;
        return new TripResponse(trip.Id, trip.Name, trip.Destination, trip.Status,
            trip.DepartureDate, trip.ReturnDate, trip.PricePerPerson, trip.SeatsTotal,
            trip.Notes, trip.CreatedAt, ps.Count, ps.Sum(p => p.Seats), rev, null);
    }
}
