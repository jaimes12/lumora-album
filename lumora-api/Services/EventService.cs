using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface IEventService
{
    Task<EventResponse> CreateAsync(string orgId, CreateEventRequest req);
    Task<EventResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<EventResponse>> GetByOrgAsync(string orgId, string? status = null, string? clientId = null);
    Task<EventResponse?> UpdateAsync(string orgId, string id, UpdateEventRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
    Task<PaymentInfo> AddPaymentAsync(string orgId, string eventId, CreatePaymentRequest req);
    Task<IEnumerable<EventPhotoResponse>> GetPhotosAsync(string orgId, string eventId);
    Task<EventPhotoResponse?> AddPhotoAsync(string orgId, string eventId, AddEventPhotoRequest req, IR2Service r2);
    Task<bool> DeletePhotoAsync(string orgId, string eventId, string photoId);
}

public class EventService(LumoraDbContext db) : IEventService
{
    // Fetch client name separately to avoid Pomelo GUID-to-binary cast issues with Include
    private async Task<string?> GetClientName(string clientId)
    {
        try
        {
            return await db.Clients
                .Where(c => c.Id == clientId)
                .Select(c => c.Name)
                .FirstOrDefaultAsync();
        }
        catch { return null; }
    }

    private async Task<List<EventPayment>> GetPayments(string eventId)
    {
        try
        {
            return await db.EventPayments
                .Where(p => p.EventId == eventId)
                .OrderBy(p => p.PaidAt)
                .ToListAsync();
        }
        catch { return []; }
    }

    public async Task<EventResponse> CreateAsync(string orgId, CreateEventRequest req)
    {
        var ev = new Event
        {
            Id = Guid.NewGuid().ToString(),
            OrgId = orgId,
            ClientId = req.ClientId,
            Name = req.Name,
            Type = req.Type,
            Status = "lead",
            Venue = req.VenueId,
            Notes = req.Notes,
            Budget = req.Budget,
            GuestCount = req.GuestCount,
            EventDate = req.EventDate.ToUniversalTime(),
            CreatedAt = DateTime.UtcNow
        };
        await db.Events.AddAsync(ev);
        await db.SaveChangesAsync();
        var clientName = await GetClientName(req.ClientId);
        return ToResponse(ev, clientName, []);
    }

    public async Task<EventResponse?> GetByIdAsync(string orgId, string id)
    {
        var ev = await db.Events
            .FirstOrDefaultAsync(e => e.Id == id && e.OrgId == orgId);
        if (ev is null) return null;
        var clientName = await GetClientName(ev.ClientId);
        var payments   = await GetPayments(id);
        return ToResponse(ev, clientName, payments);
    }

    public async Task<IEnumerable<EventResponse>> GetByOrgAsync(string orgId, string? status = null, string? clientId = null)
    {
        var query = db.Events.Where(e => e.OrgId == orgId);
        if (status   is not null) query = query.Where(e => e.Status   == status);
        if (clientId is not null) query = query.Where(e => e.ClientId == clientId);
        var list = await query.OrderByDescending(e => e.EventDate).ToListAsync();

        // Batch-fetch client names to avoid N+1 and GUID cast issues
        var clientIds = list.Select(e => e.ClientId).Distinct().ToList();
        var clientNames = await db.Clients
            .Where(c => clientIds.Contains(c.Id))
            .Select(c => new { c.Id, c.Name })
            .ToDictionaryAsync(c => c.Id, c => c.Name);

        return list.Select(e => ToResponse(e,
            clientNames.TryGetValue(e.ClientId, out var n) ? n : null, []));
    }

    public async Task<EventResponse?> UpdateAsync(string orgId, string id, UpdateEventRequest req)
    {
        var ev = await db.Events.FirstOrDefaultAsync(e => e.Id == id && e.OrgId == orgId);
        if (ev is null) return null;

        if (req.Name is not null)        ev.Name       = req.Name;
        if (req.Type is not null)        ev.Type       = req.Type;
        if (req.Status is not null)      ev.Status     = req.Status;
        if (req.ClientId is not null)    ev.ClientId   = req.ClientId;
        if (req.VenueId is not null)     ev.Venue      = req.VenueId;
        if (req.Notes is not null)       ev.Notes      = req.Notes;
        if (req.Budget.HasValue)         ev.Budget     = req.Budget.Value;
        if (req.GuestCount.HasValue)     ev.GuestCount = req.GuestCount.Value;
        if (req.EventDate.HasValue)      ev.EventDate  = req.EventDate.Value.ToUniversalTime();

        await db.SaveChangesAsync();
        return await GetByIdAsync(orgId, id);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var ev = await db.Events.FirstOrDefaultAsync(e => e.Id == id && e.OrgId == orgId);
        if (ev is null) return false;
        db.Events.Remove(ev);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<PaymentInfo> AddPaymentAsync(string orgId, string eventId, CreatePaymentRequest req)
    {
        var payment = new EventPayment
        {
            Id        = Guid.NewGuid().ToString(),
            OrgId     = orgId,
            EventId   = eventId,
            Concept   = req.Concept,
            Amount    = req.Amount,
            Method    = req.Method,
            PaidAt    = req.PaidAt?.ToUniversalTime() ?? DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        await db.EventPayments.AddAsync(payment);
        await db.SaveChangesAsync();
        return new PaymentInfo(payment.Id, payment.Concept, payment.Amount, payment.Method, payment.PaidAt);
    }

    public async Task<IEnumerable<EventPhotoResponse>> GetPhotosAsync(string orgId, string eventId) =>
        await db.EventPhotos
            .Where(p => p.EventId == eventId && p.OrgId == orgId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new EventPhotoResponse(p.Id, p.EventId, p.Url, p.Caption, p.CreatedAt))
            .ToListAsync();

    public async Task<EventPhotoResponse?> AddPhotoAsync(string orgId, string eventId, AddEventPhotoRequest req, IR2Service r2)
    {
        var exists = await db.Events.AnyAsync(e => e.Id == eventId && e.OrgId == orgId);
        if (!exists) return null;

        var bytes = Convert.FromBase64String(req.ImageData);
        var url   = await r2.UploadAsync(bytes, "image/jpeg");
        if (url is null) return null;

        var photo = new EventPhoto
        {
            Id        = Guid.NewGuid().ToString(),
            EventId   = eventId,
            OrgId     = orgId,
            Url       = url,
            Caption   = req.Caption,
            CreatedAt = DateTime.UtcNow,
        };
        await db.EventPhotos.AddAsync(photo);
        await db.SaveChangesAsync();
        return new EventPhotoResponse(photo.Id, photo.EventId, photo.Url, photo.Caption, photo.CreatedAt);
    }

    public async Task<bool> DeletePhotoAsync(string orgId, string eventId, string photoId)
    {
        var photo = await db.EventPhotos
            .FirstOrDefaultAsync(p => p.Id == photoId && p.EventId == eventId && p.OrgId == orgId);
        if (photo is null) return false;
        db.EventPhotos.Remove(photo);
        await db.SaveChangesAsync();
        return true;
    }

    private static EventResponse ToResponse(Event e, string? clientName, List<EventPayment> payments) => new(
        e.Id, e.Name, e.Type, e.Status,
        e.ClientId, clientName,
        e.Venue, e.Notes,
        e.Budget, e.GuestCount,
        e.EventDate, e.CreatedAt,
        payments.Select(p => new PaymentInfo(p.Id, p.Concept, p.Amount, p.Method, p.PaidAt)).ToList()
    );
}
