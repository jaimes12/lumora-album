using lumora_api.Data;
using lumora_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/quick-replies")]
[Authorize]
public class QuickRepliesController(LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var replies = await db.QuickReplies
            .Where(r => r.OrgId == OrgId)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();
        return Ok(replies.Select(r => new { r.Id, r.Title, r.Body }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuickReplyDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Body))
            return BadRequest(new { error = "Título y cuerpo son obligatorios" });

        var reply = new QuickReply
        {
            Id        = Guid.NewGuid().ToString(),
            OrgId     = OrgId,
            Title     = dto.Title.Trim(),
            Body      = dto.Body.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
        db.QuickReplies.Add(reply);
        await db.SaveChangesAsync();
        return Ok(new { reply.Id, reply.Title, reply.Body });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] QuickReplyDto dto)
    {
        var reply = await db.QuickReplies.FirstOrDefaultAsync(r => r.Id == id && r.OrgId == OrgId);
        if (reply is null) return NotFound();

        reply.Title = dto.Title.Trim();
        reply.Body  = dto.Body.Trim();
        await db.SaveChangesAsync();
        return Ok(new { reply.Id, reply.Title, reply.Body });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var reply = await db.QuickReplies.FirstOrDefaultAsync(r => r.Id == id && r.OrgId == OrgId);
        if (reply is null) return NotFound();

        db.QuickReplies.Remove(reply);
        await db.SaveChangesAsync();
        return Ok();
    }
}

public record QuickReplyDto(string Title, string Body);
