using lumora_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? string.Empty;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var now = DateTime.UtcNow;
        var orgId = OrgId;

        int eventsThisMonth = 0, newClientsThisMonth = 0, pendingSales = 0;
        decimal revenueThisMonth = 0;
        object upcomingEvents = Array.Empty<object>();

        try
        {
            eventsThisMonth = await db.Events
                .CountAsync(e => e.OrgId == orgId
                    && e.EventDate.Month == now.Month
                    && e.EventDate.Year == now.Year);
        }
        catch { }

        try
        {
            revenueThisMonth = await db.EventPayments
                .Where(p => p.OrgId == orgId
                    && p.PaidAt.Month == now.Month
                    && p.PaidAt.Year == now.Year)
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;
        }
        catch { }

        try
        {
            newClientsThisMonth = await db.Clients
                .CountAsync(c => c.OrgId == orgId
                    && c.CreatedAt.Month == now.Month
                    && c.CreatedAt.Year == now.Year);
        }
        catch { }

        try
        {
            pendingSales = await db.Sales
                .CountAsync(s => s.OrgId == orgId
                    && (s.Status == "draft" || s.Status == "sent"));
        }
        catch { }

        try
        {
            var events = await db.Events
                .Where(e => e.OrgId == orgId && e.EventDate >= now)
                .OrderBy(e => e.EventDate)
                .Take(5)
                .Select(e => new { e.Id, e.Name, e.Type, e.Status, e.EventDate, e.ClientId })
                .ToListAsync();

            var clientIds = events.Select(e => e.ClientId).Distinct().ToList();
            var clientNames = await db.Clients
                .Where(c => clientIds.Contains(c.Id))
                .Select(c => new { c.Id, c.Name })
                .ToDictionaryAsync(c => c.Id, c => c.Name);

            upcomingEvents = events.Select(e => new
            {
                id = e.Id,
                name = e.Name,
                type = e.Type,
                status = e.Status,
                eventDate = e.EventDate,
                clientName = clientNames.TryGetValue(e.ClientId, out var cn) ? cn : string.Empty
            }).ToList();
        }
        catch { }

        return Ok(new { eventsThisMonth, revenueThisMonth, newClientsThisMonth, pendingSales, upcomingEvents });
    }
}
