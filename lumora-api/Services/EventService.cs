using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface IEventService
{
    Task<EventResponse> CreateAsync(string orgId, CreateEventRequest req);
    Task<EventResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<EventResponse>> GetByOrgAsync(string orgId, string? status = null);
    Task<EventResponse?> UpdateAsync(string orgId, string id, UpdateEventRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
}

public class EventService(LumoraDbContext db) : IEventService
{
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
        return ToResponse(ev);
    }

    public async Task<EventResponse?> GetByIdAsync(string orgId, string id)
    {
        var ev = await db.Events.FirstOrDefaultAsync(e => e.Id == id && e.OrgId == orgId);
        return ev is null ? null : ToResponse(ev);
    }

    public async Task<IEnumerable<EventResponse>> GetByOrgAsync(string orgId, string? status = null)
    {
        var query = db.Events.Where(e => e.OrgId == orgId);
        if (status is not null) query = query.Where(e => e.Status == status);
        var list = await query.OrderByDescending(e => e.EventDate).ToListAsync();
        return list.Select(ToResponse);
    }

    public async Task<EventResponse?> UpdateAsync(string orgId, string id, UpdateEventRequest req)
    {
        var ev = await db.Events.FirstOrDefaultAsync(e => e.Id == id && e.OrgId == orgId);
        if (ev is null) return null;

        if (req.Name is not null) ev.Name = req.Name;
        if (req.Type is not null) ev.Type = req.Type;
        if (req.Status is not null) ev.Status = req.Status;
        if (req.ClientId is not null) ev.ClientId = req.ClientId;
        if (req.VenueId is not null) ev.Venue = req.VenueId;
        if (req.Notes is not null) ev.Notes = req.Notes;
        if (req.Budget.HasValue) ev.Budget = req.Budget.Value;
        if (req.GuestCount.HasValue) ev.GuestCount = req.GuestCount.Value;
        if (req.EventDate.HasValue) ev.EventDate = req.EventDate.Value.ToUniversalTime();

        await db.SaveChangesAsync();
        return ToResponse(ev);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var ev = await db.Events.FirstOrDefaultAsync(e => e.Id == id && e.OrgId == orgId);
        if (ev is null) return false;
        db.Events.Remove(ev);
        await db.SaveChangesAsync();
        return true;
    }

    private static EventResponse ToResponse(Event e) => new(
        e.Id, e.Name, e.Type, e.Status, e.ClientId, e.Venue,
        e.Notes, e.Budget, e.GuestCount,
        e.EventDate, e.CreatedAt
    );
}
