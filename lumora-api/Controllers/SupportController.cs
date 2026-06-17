using System.Security.Claims;
using lumora_api.Data;
using lumora_api.Models;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/support")]
[Authorize]
public class SupportController(LumoraDbContext db, IR2Service r2) : ControllerBase
{
    private string OrgId    => User.FindFirst("org_id")?.Value ?? "";
    private string UserName => User.FindFirst("name")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "";
    private string UserEmail => User.FindFirst("email")?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value ?? "";

    // ── List org's tickets ────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetMyTickets()
    {
        var tickets = await db.SupportTickets
            .Where(t => t.OrgId == OrgId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var ids = tickets.Select(t => t.Id).ToList();
        var msgCounts = await db.SupportMessages
            .Where(m => ids.Contains(m.TicketId))
            .GroupBy(m => m.TicketId)
            .Select(g => new { TicketId = g.Key, Count = g.Count() })
            .ToListAsync();
        var countMap = msgCounts.ToDictionary(x => x.TicketId, x => x.Count);

        return Ok(tickets.Select(t => new {
            t.Id, t.Type, t.Message, t.PhotoUrl, t.Status,
            createdAt = t.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            replyCount = countMap.GetValueOrDefault(t.Id, 0),
        }));
    }

    // ── Get single ticket with conversation ───────────────────────────────────
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTicket(string id)
    {
        var ticket = await db.SupportTickets.FindAsync(id);
        if (ticket is null || ticket.OrgId != OrgId) return NotFound();

        var messages = await db.SupportMessages
            .Where(m => m.TicketId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return Ok(new {
            ticket.Id, ticket.Type, ticket.Message, ticket.PhotoUrl, ticket.Status,
            createdAt = ticket.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            messages = messages.Select(m => new {
                m.Id, m.AuthorRole, m.AuthorName, m.Message,
                createdAt = m.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            }).ToList(),
        });
    }

    // ── Create ticket ─────────────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupportTicketRequest req)
    {
        var org = await db.Organizations.FindAsync(OrgId);

        string? photoUrl = null;
        if (!string.IsNullOrWhiteSpace(req.PhotoData) && !string.IsNullOrWhiteSpace(req.PhotoType))
        {
            try
            {
                var bytes = Convert.FromBase64String(req.PhotoData);
                var mime = req.PhotoType.Split(';')[0].Trim();
                photoUrl = await r2.UploadAsync(bytes, mime);
            }
            catch { }
        }

        var ticket = new SupportTicket
        {
            Id        = Guid.NewGuid().ToString(),
            OrgId     = OrgId,
            OrgName   = org?.Name ?? OrgId,
            UserName  = UserName,
            UserEmail = UserEmail,
            Type      = req.Type == "problema" ? "problema" : "duda",
            Message   = req.Message,
            PhotoUrl  = photoUrl,
            Status    = "open",
            CreatedAt = DateTime.UtcNow,
        };

        db.SupportTickets.Add(ticket);
        await db.SaveChangesAsync();

        return Ok(new { ticket.Id, ticket.Status, ticket.Type, ticket.Message, ticket.PhotoUrl,
            createdAt = ticket.CreatedAt.ToString("yyyy-MM-dd HH:mm"), replyCount = 0 });
    }

    // ── User reply to a ticket ────────────────────────────────────────────────
    [HttpPost("{id}/messages")]
    public async Task<IActionResult> AddMessage(string id, [FromBody] AddSupportMessageRequest req)
    {
        var ticket = await db.SupportTickets.FindAsync(id);
        if (ticket is null || ticket.OrgId != OrgId) return NotFound();
        if (ticket.Status == "closed") return BadRequest(new { message = "Este ticket está cerrado" });

        var msg = new SupportMessage
        {
            Id         = Guid.NewGuid().ToString(),
            TicketId   = id,
            AuthorRole = "user",
            AuthorName = UserName,
            Message    = req.Message,
            CreatedAt  = DateTime.UtcNow,
        };

        // Reopen ticket if it was resolved when user replies
        if (ticket.Status == "closed") ticket.Status = "open";

        db.SupportMessages.Add(msg);
        await db.SaveChangesAsync();

        return Ok(new { msg.Id, msg.AuthorRole, msg.AuthorName, msg.Message,
            createdAt = msg.CreatedAt.ToString("yyyy-MM-dd HH:mm") });
    }
}

public record CreateSupportTicketRequest(
    string Type,
    string Message,
    string? PhotoData,
    string? PhotoType
);

public record AddSupportMessageRequest(string Message);
