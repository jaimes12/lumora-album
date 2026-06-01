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
            upcomingEvents = await db.Events
                .Include(e => e.Client)
                .Where(e => e.OrgId == orgId && e.EventDate >= now)
                .OrderBy(e => e.EventDate)
                .Take(5)
                .Select(e => new
                {
                    id = e.Id,
                    name = e.Name,
                    type = e.Type,
                    status = e.Status,
                    eventDate = e.EventDate,
                    clientName = e.Client != null ? e.Client.Name : string.Empty
                })
                .ToListAsync();
        }
        catch { }

        return Ok(new { eventsThisMonth, revenueThisMonth, newClientsThisMonth, pendingSales, upcomingEvents });
    }
}
