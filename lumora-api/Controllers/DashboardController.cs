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

        var eventsThisMonth = await db.Events
            .CountAsync(e => e.OrgId == orgId
                && e.EventDate.Month == now.Month
                && e.EventDate.Year == now.Year);

        var revenueThisMonth = await db.EventPayments
            .Where(p => p.OrgId == orgId
                && p.PaidAt.Month == now.Month
                && p.PaidAt.Year == now.Year)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var newClientsThisMonth = await db.Clients
            .CountAsync(c => c.OrgId == orgId
                && c.CreatedAt.Month == now.Month
                && c.CreatedAt.Year == now.Year);

        var pendingSales = await db.Sales
            .CountAsync(s => s.OrgId == orgId
                && (s.Status == "draft" || s.Status == "sent"));

        var upcomingEvents = await db.Events
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

        return Ok(new
        {
            eventsThisMonth,
            revenueThisMonth,
            newClientsThisMonth,
            pendingSales,
            upcomingEvents
        });
    }
}
