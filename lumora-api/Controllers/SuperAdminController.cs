using lumora_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/superadmin")]
[Authorize]
public class SuperAdminController(LumoraDbContext db, IConfiguration config) : ControllerBase
{
    private bool IsSuperAdmin =>
        User.FindFirst("email")?.Value?.ToLower() ==
        (config["SuperAdmin:Email"] ?? "").ToLower();

    // ── Overview ──────────────────────────────────────────────────────────────
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs    = await db.Organizations.ToListAsync();
        var users   = await db.Users.ToListAsync();
        var events  = await db.Events.ToListAsync();
        var clients = await db.Clients.ToListAsync();
        var payments = await db.EventPayments.ToListAsync();

        var byPlan = orgs
            .GroupBy(o => o.Plan)
            .Select(g => new { plan = g.Key, label = PlanLabel(g.Key), count = g.Count() })
            .OrderBy(x => PlanOrder(x.plan))
            .ToList();

        var year = DateTime.UtcNow.Year;
        var monthLabels = new[] { "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic" };
        var orgsByMonthDict = orgs
            .Where(o => o.CreatedAt.Year == year)
            .GroupBy(o => o.CreatedAt.Month)
            .ToDictionary(g => g.Key, g => g.Count());
        var orgsByMonth = Enumerable.Range(1, 12)
            .Select(m => new { label = monthLabels[m - 1], value = orgsByMonthDict.GetValueOrDefault(m, 0) })
            .ToList();

        var recentOrgs = orgs
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new {
                o.Id, o.Name, o.Plan,
                label     = PlanLabel(o.Plan),
                createdAt = o.CreatedAt.ToString("dd/MM/yyyy"),
                userCount  = users.Count(u => u.OrgId == o.Id),
                eventCount = events.Count(e => e.OrgId == o.Id),
            })
            .ToList();

        return Ok(new {
            totalOrgs     = orgs.Count,
            totalUsers    = users.Count(u => u.Role == "admin"),
            totalWorkers  = users.Count(u => u.Role == "member"),
            totalEvents   = events.Count,
            totalClients  = clients.Count,
            totalRevenue  = payments.Sum(p => p.Amount),
            byPlan,
            orgsByMonth,
            recentOrgs,
        });
    }

    // ── Orgs ──────────────────────────────────────────────────────────────────
    [HttpGet("orgs")]
    public async Task<IActionResult> GetOrgs()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs    = await db.Organizations.OrderByDescending(o => o.CreatedAt).ToListAsync();
        var users   = await db.Users.ToListAsync();
        var events  = await db.Events.ToListAsync();
        var clients = await db.Clients.ToListAsync();

        var result = orgs.Select(o => new {
            o.Id, o.Name, o.Plan,
            planLabel  = PlanLabel(o.Plan),
            createdAt  = o.CreatedAt.ToString("dd/MM/yyyy"),
            userCount  = users.Count(u => u.OrgId == o.Id && u.Role == "admin"),
            workerCount = users.Count(u => u.OrgId == o.Id && u.Role == "member"),
            eventCount = events.Count(e => e.OrgId == o.Id),
            clientCount = clients.Count(c => c.OrgId == o.Id),
        }).ToList();

        return Ok(result);
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (!IsSuperAdmin) return Forbid();

        var users = await db.Users
            .Include(u => u.Organization)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var result = users.Select(u => new {
            u.Id, u.Name, u.Email, u.Phone, u.Role,
            orgName   = u.Organization?.Name ?? "—",
            plan      = u.Organization?.Plan ?? "—",
            planLabel = PlanLabel(u.Organization?.Plan ?? ""),
            createdAt = u.CreatedAt.ToString("dd/MM/yyyy"),
        }).ToList();

        return Ok(result);
    }

    // ── Events ────────────────────────────────────────────────────────────────
    [HttpGet("events")]
    public async Task<IActionResult> GetEvents()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs = await db.Organizations.ToDictionaryAsync(o => o.Id, o => o.Name);
        var events = await db.Events
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var result = events.Select(e => new {
            e.Id, e.Name, e.Type, e.Status, e.Budget,
            orgName   = orgs.GetValueOrDefault(e.OrgId, "—"),
            eventDate = e.EventDate.ToString("dd/MM/yyyy"),
            createdAt = e.CreatedAt.ToString("dd/MM/yyyy"),
        }).ToList();

        return Ok(result);
    }

    // ── Clients ───────────────────────────────────────────────────────────────
    [HttpGet("clients")]
    public async Task<IActionResult> GetClients()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs = await db.Organizations.ToDictionaryAsync(o => o.Id, o => o.Name);
        var clients = await db.Clients
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var result = clients.Select(c => new {
            c.Id, c.Name, c.Email, c.Phone,
            orgName   = orgs.GetValueOrDefault(c.OrgId, "—"),
            createdAt = c.CreatedAt.ToString("dd/MM/yyyy"),
        }).ToList();

        return Ok(result);
    }

    private static string PlanLabel(string plan) => plan switch {
        "solo"    => "Solo",
        "negocio" => "Negocio",
        "agencia" => "Agencia",
        _         => "Sin plan",
    };

    private static int PlanOrder(string plan) => plan switch {
        "agencia" => 0, "negocio" => 1, "solo" => 2, _ => 3,
    };
}
