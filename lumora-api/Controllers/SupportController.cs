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
    private string OrgId => User.FindFirst("org_id")?.Value ?? "";
    private string UserName => User.FindFirst("name")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "";
    private string UserEmail => User.FindFirst("email")?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value ?? "";

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
            catch { /* photo upload is non-fatal */ }
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

        return Ok(new { ticket.Id, ticket.Status });
    }
}

public record CreateSupportTicketRequest(
    string Type,
    string Message,
    string? PhotoData,
    string? PhotoType
);
