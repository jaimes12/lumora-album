using System.Security.Claims;
using lumora_api.Data;
using lumora_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/notas")]
[Authorize]
public class NotasController(LumoraDbContext db) : ControllerBase
{
    private string OrgId    => User.FindFirst("org_id")?.Value ?? "";
    private string UserId   => User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? "";
    private string UserName => User.FindFirst("name")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "";
    private string UserRole => User.FindFirst("role")?.Value ?? "worker";

    private async Task<bool> IsAgenciaAsync()
    {
        var org = await db.Organizations.FindAsync(OrgId);
        return org?.Plan == "agencia";
    }

    // ── List notes ────────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetNotes()
    {
        if (!await IsAgenciaAsync()) return Forbid();

        var notes = await db.SharedNotes
            .Where(n => n.OrgId == OrgId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        var noteIds = notes.Select(n => n.Id).ToList();
        var allReactions = await db.NoteReactions
            .Where(r => noteIds.Contains(r.NoteId))
            .ToListAsync();

        return Ok(notes.Select(n =>
        {
            var rxns = allReactions.Where(r => r.NoteId == n.Id).ToList();
            var grouped = rxns
                .GroupBy(r => r.Emoji)
                .Select(g => new
                {
                    emoji = g.Key,
                    count = g.Count(),
                    users = g.Select(r => r.UserName).ToList(),
                    mine  = g.Any(r => r.UserId == UserId),
                })
                .ToList();
            return new
            {
                n.Id, n.Content, n.Color,
                userName  = n.UserName,
                userPhoto = n.UserPhoto,
                userId    = n.UserId,
                isOwn     = n.UserId == UserId,
                createdAt = n.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                reactions = grouped,
            };
        }));
    }

    // ── Create note ───────────────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> CreateNote([FromBody] CreateNoteRequest req)
    {
        if (!await IsAgenciaAsync()) return Forbid();
        if (string.IsNullOrWhiteSpace(req.Content)) return BadRequest("El contenido es requerido.");

        var note = new SharedNote
        {
            Id        = Guid.NewGuid().ToString(),
            OrgId     = OrgId,
            UserId    = UserId,
            UserName  = UserName,
            Content   = req.Content.Trim(),
            Color     = req.Color ?? "yellow",
            CreatedAt = DateTime.UtcNow,
        };
        db.SharedNotes.Add(note);
        await db.SaveChangesAsync();

        return Ok(new
        {
            note.Id, note.Content, note.Color,
            userName  = note.UserName,
            userPhoto = note.UserPhoto,
            userId    = note.UserId,
            isOwn     = true,
            createdAt = note.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
            reactions = Array.Empty<object>(),
        });
    }

    // ── Delete note ───────────────────────────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNote(string id)
    {
        if (!await IsAgenciaAsync()) return Forbid();

        var note = await db.SharedNotes.FindAsync(id);
        if (note is null || note.OrgId != OrgId) return NotFound();
        if (note.UserId != UserId && UserRole != "admin") return Forbid();

        db.NoteReactions.RemoveRange(db.NoteReactions.Where(r => r.NoteId == id));
        db.SharedNotes.Remove(note);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Toggle reaction ───────────────────────────────────────────────────────
    [HttpPost("{id}/reactions")]
    public async Task<IActionResult> ToggleReaction(string id, [FromBody] ToggleReactionRequest req)
    {
        if (!await IsAgenciaAsync()) return Forbid();

        var note = await db.SharedNotes.FindAsync(id);
        if (note is null || note.OrgId != OrgId) return NotFound();

        var existing = await db.NoteReactions
            .FirstOrDefaultAsync(r => r.NoteId == id && r.UserId == UserId && r.Emoji == req.Emoji);

        if (existing is not null)
        {
            db.NoteReactions.Remove(existing);
        }
        else
        {
            db.NoteReactions.Add(new NoteReaction
            {
                Id        = Guid.NewGuid().ToString(),
                NoteId    = id,
                UserId    = UserId,
                UserName  = UserName,
                Emoji     = req.Emoji,
                CreatedAt = DateTime.UtcNow,
            });
        }
        await db.SaveChangesAsync();

        var reactions = await db.NoteReactions.Where(r => r.NoteId == id).ToListAsync();
        var grouped = reactions
            .GroupBy(r => r.Emoji)
            .Select(g => new
            {
                emoji = g.Key,
                count = g.Count(),
                users = g.Select(r => r.UserName).ToList(),
                mine  = g.Any(r => r.UserId == UserId),
            });

        return Ok(grouped);
    }
}

public record CreateNoteRequest(string Content, string? Color);
public record ToggleReactionRequest(string Emoji);
