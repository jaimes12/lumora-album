using Google.Cloud.Firestore;
using lumora_api.DTOs;
using lumora_api.Models;

namespace lumora_api.Services;

public interface IEventService
{
    Task<EventResponse> CreateAsync(string orgId, CreateEventRequest req);
    Task<EventResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<EventResponse>> GetByOrgAsync(string orgId, string? status = null);
    Task<EventResponse?> UpdateAsync(string orgId, string id, UpdateEventRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
}

public class EventService(FirestoreDb db) : IEventService
{
    private readonly CollectionReference _col = db.Collection("events");

    public async Task<EventResponse> CreateAsync(string orgId, CreateEventRequest req)
    {
        var ev = new Event
        {
            OrgId = orgId,
            Name = req.Name,
            Type = req.Type,
            Status = "lead",
            ClientId = req.ClientId,
            VenueId = req.VenueId,
            Notes = req.Notes,
            Budget = req.Budget,
            GuestCount = req.GuestCount,
            EventDate = Timestamp.FromDateTime(req.EventDate.ToUniversalTime()),
            CreatedAt = Timestamp.GetCurrentTimestamp()
        };
        var doc = await _col.AddAsync(ev);
        ev.Id = doc.Id;
        return ToResponse(ev);
    }

    public async Task<EventResponse?> GetByIdAsync(string orgId, string id)
    {
        var snap = await _col.Document(id).GetSnapshotAsync();
        if (!snap.Exists) return null;
        var ev = snap.ConvertTo<Event>();
        ev.Id = snap.Id;
        return ev.OrgId == orgId ? ToResponse(ev) : null;
    }

    public async Task<IEnumerable<EventResponse>> GetByOrgAsync(string orgId, string? status = null)
    {
        Query query = _col.WhereEqualTo("OrgId", orgId).OrderByDescending("EventDate");
        if (status is not null) query = query.WhereEqualTo("Status", status);
        var snap = await query.GetSnapshotAsync();
        return snap.Documents.Select(d => { var e = d.ConvertTo<Event>(); e.Id = d.Id; return ToResponse(e); });
    }

    public async Task<EventResponse?> UpdateAsync(string orgId, string id, UpdateEventRequest req)
    {
        var docRef = _col.Document(id);
        var snap = await docRef.GetSnapshotAsync();
        if (!snap.Exists) return null;
        var ev = snap.ConvertTo<Event>();
        if (ev.OrgId != orgId) return null;

        var updates = new Dictionary<string, object>();
        if (req.Name is not null) updates["Name"] = req.Name;
        if (req.Type is not null) updates["Type"] = req.Type;
        if (req.Status is not null) updates["Status"] = req.Status;
        if (req.ClientId is not null) updates["ClientId"] = req.ClientId;
        if (req.VenueId is not null) updates["VenueId"] = req.VenueId;
        if (req.Notes is not null) updates["Notes"] = req.Notes;
        if (req.Budget.HasValue) updates["Budget"] = req.Budget.Value;
        if (req.GuestCount.HasValue) updates["GuestCount"] = req.GuestCount.Value;
        if (req.EventDate.HasValue)
            updates["EventDate"] = Timestamp.FromDateTime(req.EventDate.Value.ToUniversalTime());

        if (updates.Count > 0) await docRef.UpdateAsync(updates);
        return await GetByIdAsync(orgId, id);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var snap = await _col.Document(id).GetSnapshotAsync();
        if (!snap.Exists) return false;
        var ev = snap.ConvertTo<Event>();
        if (ev.OrgId != orgId) return false;
        await _col.Document(id).DeleteAsync();
        return true;
    }

    private static EventResponse ToResponse(Event e) => new(
        e.Id, e.Name, e.Type, e.Status, e.ClientId, e.VenueId,
        e.Notes, e.Budget, e.GuestCount,
        e.EventDate.ToDateTime(), e.CreatedAt.ToDateTime()
    );
}
