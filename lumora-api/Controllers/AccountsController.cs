using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize]
public class AccountsController(LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? string.Empty;
    private string UserId => User.FindFirst("user_id")?.Value ?? string.Empty;
    // Fallback to "admin" for existing sessions issued before the role claim was added
    private string UserRole =>
        User.FindFirst("role")?.Value ??
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ??
        "admin";

    // ── Cuentas ──────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (UserRole != "admin") return Forbid();

        var accounts = await db.Accounts
            .Where(a => a.OrgId == OrgId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var accountIds = accounts.Select(a => a.Id).ToList();
        var entries = await db.AccountEntries
            .Where(e => accountIds.Contains(e.AccountId))
            .Select(e => new { e.AccountId, e.Type, e.Amount })
            .ToListAsync();

        var result = accounts.Select(a => {
            var accEntries = entries.Where(e => e.AccountId == a.Id).ToList();
            var ingresos = accEntries.Where(e => e.Type == "ingreso").Sum(e => e.Amount);
            var gastos   = accEntries.Where(e => e.Type == "gasto").Sum(e => e.Amount);
            return new AccountResponse(a.Id, a.Name, a.CreatedAt, accEntries.Count, ingresos, gastos, ingresos - gastos);
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountRequest req)
    {
        if (UserRole != "admin") return Forbid();

        var account = new Account {
            Id = Guid.NewGuid().ToString(),
            OrgId = OrgId,
            Name = req.Name.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedById = UserId,
        };
        await db.Accounts.AddAsync(account);
        await db.SaveChangesAsync();

        return Ok(new AccountResponse(account.Id, account.Name, account.CreatedAt, 0, 0, 0, 0));
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateAccountRequest req)
    {
        if (UserRole != "admin") return Forbid();

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.OrgId == OrgId);
        if (account is null) return NotFound();
        account.Name = req.Name.Trim();
        await db.SaveChangesAsync();
        return Ok(new { account.Id, account.Name });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (UserRole != "admin") return Forbid();

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.OrgId == OrgId);
        if (account is null) return NotFound();

        var entries = db.AccountEntries.Where(e => e.AccountId == id);
        db.AccountEntries.RemoveRange(entries);
        db.Accounts.Remove(account);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Movimientos ──────────────────────────────────────────────────────────

    [HttpGet("{id}/entries")]
    public async Task<IActionResult> GetEntries(string id, [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? tripId, [FromQuery] string? type)
    {
        if (UserRole != "admin") return Forbid();

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.OrgId == OrgId);
        if (account is null) return NotFound();

        var q = db.AccountEntries.Where(e => e.AccountId == id);
        if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var fromDate))
            q = q.Where(e => e.EntryDate >= fromDate);
        if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var toDate))
            q = q.Where(e => e.EntryDate < toDate.AddDays(1));
        if (!string.IsNullOrEmpty(tripId))
            q = q.Where(e => e.TripId == tripId);
        if (!string.IsNullOrEmpty(type))
            q = q.Where(e => e.Type == type);

        var entries = await q.OrderByDescending(e => e.EntryDate).ThenByDescending(e => e.CreatedAt).ToListAsync();

        var tripIds = entries.Select(e => e.TripId).Where(t => t != null).Distinct().ToList();
        var tripNames = await db.Trips
            .Where(t => tripIds.Contains(t.Id))
            .Select(t => new { t.Id, t.Name })
            .ToDictionaryAsync(t => t.Id, t => t.Name);

        return Ok(entries.Select(e => new AccountEntryResponse(
            e.Id, e.AccountId, e.EntryDate, e.Concept, e.Category, e.Type, e.Amount,
            e.TripId, e.TripId != null && tripNames.TryGetValue(e.TripId, out var n) ? n : null,
            e.Notes, e.CreatedAt
        )));
    }

    [HttpPost("{id}/entries")]
    public async Task<IActionResult> AddEntry(string id, [FromBody] CreateAccountEntryRequest req)
    {
        if (UserRole != "admin") return Forbid();

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.OrgId == OrgId);
        if (account is null) return NotFound();

        var entry = new AccountEntry {
            Id = Guid.NewGuid().ToString(),
            AccountId = id,
            OrgId = OrgId,
            EntryDate = req.EntryDate ?? DateTime.UtcNow,
            Concept = req.Concept?.Trim() ?? string.Empty,
            Category = string.IsNullOrWhiteSpace(req.Category) ? null : req.Category.Trim(),
            Type = req.Type == "ingreso" ? "ingreso" : "gasto",
            Amount = req.Amount,
            TripId = string.IsNullOrEmpty(req.TripId) ? null : req.TripId,
            Notes = req.Notes,
            CreatedAt = DateTime.UtcNow,
        };
        await db.AccountEntries.AddAsync(entry);
        await db.SaveChangesAsync();

        string? tripName = null;
        if (entry.TripId != null)
            tripName = await db.Trips.Where(t => t.Id == entry.TripId).Select(t => t.Name).FirstOrDefaultAsync();

        return Ok(new AccountEntryResponse(
            entry.Id, entry.AccountId, entry.EntryDate, entry.Concept, entry.Category,
            entry.Type, entry.Amount, entry.TripId, tripName, entry.Notes, entry.CreatedAt
        ));
    }

    [HttpPatch("{id}/entries/{entryId}")]
    public async Task<IActionResult> UpdateEntry(string id, string entryId, [FromBody] UpdateAccountEntryRequest req)
    {
        if (UserRole != "admin") return Forbid();

        var entry = await db.AccountEntries.FirstOrDefaultAsync(e => e.Id == entryId && e.AccountId == id && e.OrgId == OrgId);
        if (entry is null) return NotFound();

        if (req.EntryDate.HasValue)           entry.EntryDate = req.EntryDate.Value;
        if (req.Concept is not null)          entry.Concept   = req.Concept.Trim();
        if (req.Category is not null)         entry.Category  = string.IsNullOrWhiteSpace(req.Category) ? null : req.Category.Trim();
        if (req.Type is not null)             entry.Type      = req.Type == "ingreso" ? "ingreso" : "gasto";
        if (req.Amount.HasValue)              entry.Amount    = req.Amount.Value;
        if (req.ClearTripId)                  entry.TripId    = null;
        else if (req.TripId is not null)      entry.TripId    = string.IsNullOrEmpty(req.TripId) ? null : req.TripId;
        if (req.Notes is not null)            entry.Notes     = req.Notes;

        await db.SaveChangesAsync();

        string? tripName = null;
        if (entry.TripId != null)
            tripName = await db.Trips.Where(t => t.Id == entry.TripId).Select(t => t.Name).FirstOrDefaultAsync();

        return Ok(new AccountEntryResponse(
            entry.Id, entry.AccountId, entry.EntryDate, entry.Concept, entry.Category,
            entry.Type, entry.Amount, entry.TripId, tripName, entry.Notes, entry.CreatedAt
        ));
    }

    [HttpDelete("{id}/entries/{entryId}")]
    public async Task<IActionResult> DeleteEntry(string id, string entryId)
    {
        if (UserRole != "admin") return Forbid();

        var entry = await db.AccountEntries.FirstOrDefaultAsync(e => e.Id == entryId && e.AccountId == id && e.OrgId == OrgId);
        if (entry is null) return NotFound();
        db.AccountEntries.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
