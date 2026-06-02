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
    Task<LeadMessagesPage> GetMessagesPageAsync(string orgId, string leadId, int skip, int take);
    Task HandleInboundAsync(string orgId, string phone, string body, string? pushname = null,
        string? mediaData = null, string? mediaType = null);
    Task HandleOutboundAsync(string orgId, string phone, string body,
        string? mediaData = null, string? mediaType = null);
    Task<int> DeleteAllAsync(string orgId);
}

public class LeadService(LumoraDbContext db, IWaServerService waServer, IR2Service r2) : ILeadService
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
            .FirstOrDefaultAsync(l => l.Id == id && l.OrgId == orgId);
        if (lead is null) return null;
        // Only load last 20 messages — frontend paginates older ones on demand
        var msgs = await db.LeadMessages
            .Where(m => m.LeadId == id)
            .OrderByDescending(m => m.SentAt)
            .Take(20)
            .OrderBy(m => m.SentAt)
            .ToListAsync();
        return new LeadResponse(
            lead.Id, lead.ClientId, lead.Name, lead.Phone, lead.EventType, lead.EventDate,
            lead.Budget, lead.Stage, lead.LastMessage, lead.UnreadCount,
            lead.CreatedAt, lead.LastMessageAt,
            msgs.Select(ToMessageResponse).ToList());
    }

    public async Task<IEnumerable<LeadResponse>> GetByOrgAsync(string orgId, string? stage = null)
    {
        var query = db.Leads.Where(l => l.OrgId == orgId);
        if (stage is not null) query = query.Where(l => l.Stage == stage);
        var list = await query.OrderByDescending(l => l.LastMessageAt).ToListAsync();
        // Messages are loaded on demand when a chat is opened — not needed for the pipeline view
        return list.Select(l => new LeadResponse(
            l.Id, l.ClientId, l.Name, l.Phone, l.EventType, l.EventDate,
            l.Budget, l.Stage, l.LastMessage, l.UnreadCount,
            l.CreatedAt, l.LastMessageAt, []));
    }

    public async Task<LeadMessagesPage> GetMessagesPageAsync(string orgId, string leadId, int skip, int take)
    {
        var query = db.LeadMessages.Where(m => m.LeadId == leadId && m.OrgId == orgId);
        var total = await query.CountAsync();
        var msgs  = await query
            .OrderByDescending(m => m.SentAt)
            .Skip(skip)
            .Take(take)
            .OrderBy(m => m.SentAt)
            .ToListAsync();
        return new LeadMessagesPage(total, msgs.Select(ToMessageResponse).ToList());
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

        var mediaUrl  = await UploadMediaIfPresent(req.MediaData, req.MediaType);
        var mime      = req.MediaType?.Split(';')[0].Trim();
        var summary   = string.IsNullOrWhiteSpace(req.Body) && mediaUrl is not null
            ? $"[{(mime?.StartsWith("image") == true ? "Imagen" : "Audio")}]"
            : req.Body ?? "";

        var message = new LeadMessage
        {
            Id        = Guid.NewGuid().ToString(),
            LeadId    = leadId,
            OrgId     = orgId,
            Body      = summary,
            Direction = req.Direction,
            MediaUrl  = mediaUrl,
            MediaType = mime,
            SentAt    = DateTime.UtcNow
        };
        await db.LeadMessages.AddAsync(message);

        lead.LastMessage   = summary;
        lead.LastMessageAt = message.SentAt;
        if (req.Direction == "inbound")
            lead.UnreadCount++;

        await db.SaveChangesAsync();

        // Fire-and-forget WA send — DB save already succeeded, WA failure is non-fatal
        if (req.Direction == "outbound" && !string.IsNullOrWhiteSpace(lead.Phone))
            _ = waServer.SendAsync(orgId, lead.Phone, req.Body ?? "", mediaUrl, mime);

        return ToMessageResponse(message);
    }

    public async Task<int> DeleteAllAsync(string orgId)
    {
        var items = await db.Leads.Where(l => l.OrgId == orgId).ToListAsync();
        db.Leads.RemoveRange(items); // lead_messages cascade via FK
        await db.SaveChangesAsync();
        return items.Count;
    }

    public async Task HandleInboundAsync(string orgId, string phone, string body,
        string? pushname = null, string? mediaData = null, string? mediaType = null)
    {
        var (lead, last10) = await FindOrCreateLead(orgId, phone, pushname);

        var mediaUrl = await UploadMediaIfPresent(mediaData, mediaType);
        var summary  = string.IsNullOrWhiteSpace(body) && mediaUrl is not null
            ? $"[{(mediaType?.StartsWith("image") == true ? "Imagen" : "Audio")}]"
            : body;

        var message = new LeadMessage
        {
            Id        = Guid.NewGuid().ToString(),
            LeadId    = lead.Id,
            OrgId     = orgId,
            Body      = summary,
            Direction = "inbound",
            MediaUrl  = mediaUrl,
            MediaType = mediaType,
            SentAt    = DateTime.UtcNow,
        };
        await db.LeadMessages.AddAsync(message);

        lead.LastMessage   = summary;
        lead.LastMessageAt = message.SentAt;
        lead.UnreadCount++;
        await db.SaveChangesAsync();
    }

    // Sync a message sent from the user's own phone to an EXISTING lead.
    // Does NOT create a new lead — only adds the message if the lead exists.
    public async Task HandleOutboundAsync(string orgId, string phone, string body,
        string? mediaData = null, string? mediaType = null)
    {
        phone = System.Text.RegularExpressions.Regex.Replace(phone, @"@\S+", "").Trim();
        var digits = System.Text.RegularExpressions.Regex.Replace(phone, @"\D", "");
        var last10 = digits.Length >= 10 ? digits[^10..] : digits;

        var lead = await db.Leads.FirstOrDefaultAsync(l => l.OrgId == orgId && l.Phone.EndsWith(last10));
        if (lead is null) return; // no existing conversation → skip

        var mediaUrl = await UploadMediaIfPresent(mediaData, mediaType);
        var summary  = string.IsNullOrWhiteSpace(body) && mediaUrl is not null
            ? $"[{(mediaType?.StartsWith("image") == true ? "Imagen" : "Audio")}]"
            : body;

        var message = new LeadMessage
        {
            Id        = Guid.NewGuid().ToString(),
            LeadId    = lead.Id,
            OrgId     = orgId,
            Body      = summary,
            Direction = "outbound",
            MediaUrl  = mediaUrl,
            MediaType = mediaType,
            SentAt    = DateTime.UtcNow,
        };
        await db.LeadMessages.AddAsync(message);

        lead.LastMessage   = summary;
        lead.LastMessageAt = message.SentAt;
        await db.SaveChangesAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<string?> UploadMediaIfPresent(string? mediaData, string? mediaType)
    {
        if (string.IsNullOrWhiteSpace(mediaData) || string.IsNullOrWhiteSpace(mediaType))
            return null;
        try
        {
            var bytes = Convert.FromBase64String(mediaData);
            // Normalize MIME (e.g. "audio/ogg; codecs=opus" → "audio/ogg")
            var mime = mediaType.Split(';')[0].Trim();
            return await r2.UploadAsync(bytes, mime);
        }
        catch { return null; }
    }

    private async Task<(Lead lead, string last10)> FindOrCreateLead(string orgId, string phone, string? pushname)
    {
        phone = System.Text.RegularExpressions.Regex.Replace(phone, @"@\S+", "").Trim();
        var digits = System.Text.RegularExpressions.Regex.Replace(phone, @"\D", "");
        var last10 = digits.Length >= 10 ? digits[^10..] : digits;

        var lead = await db.Leads
            .Include(l => l.Messages)
            .FirstOrDefaultAsync(l => l.OrgId == orgId && l.Phone.EndsWith(last10));

        if (lead is null)
        {
            var name = !string.IsNullOrWhiteSpace(pushname)
                ? pushname
                : digits.Length >= 10 ? digits[^10..] : digits;
            lead = new Lead { Id = Guid.NewGuid().ToString(), OrgId = orgId, Name = name,
                Phone = digits.Length > 0 ? digits : phone, Stage = "nuevo", CreatedAt = DateTime.UtcNow };
            await db.Leads.AddAsync(lead);
            await db.SaveChangesAsync();
        }
        else if (!string.IsNullOrWhiteSpace(pushname)
                 && (string.IsNullOrWhiteSpace(lead.Name) || lead.Name == last10))
        {
            lead.Name = pushname;
        }
        return (lead, last10);
    }

    private static LeadResponse ToResponse(Lead l) => new(
        l.Id, l.ClientId, l.Name, l.Phone, l.EventType, l.EventDate, l.Budget,
        l.Stage, l.LastMessage, l.UnreadCount, l.CreatedAt, l.LastMessageAt,
        l.Messages.OrderBy(m => m.SentAt).Select(ToMessageResponse).ToList()
    );

    private static LeadMessageResponse ToMessageResponse(LeadMessage m) => new(
        m.Id, m.LeadId, m.Body, m.Direction, m.MediaUrl, m.MediaType,
        // Stamp as UTC so the browser converts to its local timezone correctly
        DateTime.SpecifyKind(m.SentAt, DateTimeKind.Utc)
    );
}
