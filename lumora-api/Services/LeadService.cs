using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface ILeadService
{
    Task<LeadResponse> CreateAsync(string orgId, CreateLeadRequest req);
    Task<LeadResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<LeadResponse>> GetByOrgAsync(string orgId, string? stage = null);
    Task<LeadResponse?> UpdateAsync(string orgId, string id, UpdateLeadRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
    Task<LeadMessageResponse?> SendMessageAsync(string orgId, string leadId, SendLeadMessageRequest req);
}

public class LeadService(LumoraDbContext db, IWaServerService waServer) : ILeadService
{
    public async Task<LeadResponse> CreateAsync(string orgId, CreateLeadRequest req)
    {
        var lead = new Lead
        {
            Id = Guid.NewGuid().ToString(),
            OrgId = orgId,
            Name = req.Name,
            Phone = req.Phone,
            EventType = req.EventType,
            EventDate = req.EventDate,
            Budget = req.Budget,
            Stage = "nuevo",
            UnreadCount = 0,
            CreatedAt = DateTime.UtcNow
        };
        await db.Leads.AddAsync(lead);
        await db.SaveChangesAsync();
        return ToResponse(lead);
    }

    public async Task<LeadResponse?> GetByIdAsync(string orgId, string id)
    {
        var lead = await db.Leads
            .Include(l => l.Messages)
            .FirstOrDefaultAsync(l => l.Id == id && l.OrgId == orgId);
        return lead is null ? null : ToResponse(lead);
    }

    public async Task<IEnumerable<LeadResponse>> GetByOrgAsync(string orgId, string? stage = null)
    {
        var query = db.Leads.Include(l => l.Messages).Where(l => l.OrgId == orgId);
        if (stage is not null) query = query.Where(l => l.Stage == stage);
        var list = await query.OrderByDescending(l => l.LastMessageAt).ToListAsync();
        return list.Select(ToResponse);
    }

    public async Task<LeadResponse?> UpdateAsync(string orgId, string id, UpdateLeadRequest req)
    {
        var lead = await db.Leads
            .Include(l => l.Messages)
            .FirstOrDefaultAsync(l => l.Id == id && l.OrgId == orgId);
        if (lead is null) return null;

        if (req.Name is not null) lead.Name = req.Name;
        if (req.Phone is not null) lead.Phone = req.Phone;
        if (req.EventType is not null) lead.EventType = req.EventType;
        if (req.EventDate is not null) lead.EventDate = req.EventDate;
        if (req.Budget.HasValue) lead.Budget = req.Budget.Value;
        if (req.Stage is not null) lead.Stage = req.Stage;
        if (req.LastMessage is not null) lead.LastMessage = req.LastMessage;

        await db.SaveChangesAsync();
        return ToResponse(lead);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == id && l.OrgId == orgId);
        if (lead is null) return false;
        db.Leads.Remove(lead);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<LeadMessageResponse?> SendMessageAsync(string orgId, string leadId, SendLeadMessageRequest req)
    {
        var lead = await db.Leads
            .Include(l => l.Messages)
            .FirstOrDefaultAsync(l => l.Id == leadId && l.OrgId == orgId);
        if (lead is null) return null;

        var message = new LeadMessage
        {
            Id = Guid.NewGuid().ToString(),
            LeadId = leadId,
            OrgId = orgId,
            Body = req.Body,
            Direction = req.Direction,
            SentAt = DateTime.UtcNow
        };
        await db.LeadMessages.AddAsync(message);

        lead.LastMessage = req.Body;
        lead.LastMessageAt = message.SentAt;
        if (req.Direction == "inbound")
            lead.UnreadCount++;

        await db.SaveChangesAsync();

        // Fire-and-forget WA send — DB save already succeeded, WA failure is non-fatal
        if (req.Direction == "outbound" && !string.IsNullOrWhiteSpace(lead.Phone))
            _ = waServer.SendAsync(orgId, lead.Phone, req.Body);

        return ToMessageResponse(message);
    }

    private static LeadResponse ToResponse(Lead l) => new(
        l.Id,
        l.ClientId,
        l.Name,
        l.Phone,
        l.EventType,
        l.EventDate,
        l.Budget,
        l.Stage,
        l.LastMessage,
        l.UnreadCount,
        l.CreatedAt,
        l.LastMessageAt,
        l.Messages.OrderBy(m => m.SentAt).Select(ToMessageResponse).ToList()
    );

    private static LeadMessageResponse ToMessageResponse(LeadMessage m) => new(
        m.Id,
        m.LeadId,
        m.Body,
        m.Direction,
        m.SentAt
    );
}
