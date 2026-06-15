using lumora_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/ventas")]
[Authorize]
public class VentasStatsController(LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? string.Empty;

    static DateTime WeekStart(DateTime d)
    {
        int dow = (int)d.DayOfWeek;
        return d.Date.AddDays(dow == 0 ? -6 : -(dow - 1));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string? mes = null)
    {
        var now   = DateTime.UtcNow;
        var orgId = OrgId;

        DateTime? fStart = null, fEnd = null;
        if (!string.IsNullOrEmpty(mes))
        {
            var p = mes.Split('-');
            if (p.Length == 2 && int.TryParse(p[0], out var y) && int.TryParse(p[1], out var mo))
            {
                fStart = new DateTime(y, mo, 1, 0, 0, 0, DateTimeKind.Utc);
                fEnd   = fStart.Value.AddMonths(1);
            }
        }

        var allEvents = await db.Events
            .Where(e => e.OrgId == orgId && e.Status != "cancelled")
            .Select(e => new { e.CreatedAt, e.Budget })
            .ToListAsync();

        var allPayments = await db.EventPayments
            .Where(p => p.OrgId == orgId)
            .Select(p => new { p.PaidAt, p.Amount, p.Method })
            .ToListAsync();

        var filtEvents   = fStart.HasValue
            ? allEvents.Where(e => e.CreatedAt >= fStart && e.CreatedAt < fEnd).ToList()
            : allEvents;
        var filtPayments = fStart.HasValue
            ? allPayments.Where(p => p.PaidAt >= fStart && p.PaidAt < fEnd).ToList()
            : allPayments;

        var todaySales    = allEvents.Where(e => e.CreatedAt.Date == now.Date).Sum(e => e.Budget);
        var totalSales    = filtEvents.Sum(e => e.Budget);
        var totalPayments = filtPayments.Sum(p => p.Amount);
        var totalEvents   = filtEvents.Count;

        var thirtyAgo    = now.Date.AddDays(-30);
        var dailyAverage = allPayments.Where(p => p.PaidAt >= thirtyAgo).Sum(p => p.Amount) / 30m;

        // By month — last 12 months, always full history for context
        var twelveAgo = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11);
        var byMonth = allEvents
            .Where(e => e.CreatedAt >= twelveAgo)
            .GroupBy(e => new { e.CreatedAt.Year, e.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new { label = $"{g.Key.Month:D2}/{g.Key.Year}", value = g.Sum(e => e.Budget) })
            .ToList();

        // By day — last 30 days or filtered month
        var daySource = fStart.HasValue
            ? filtEvents
            : allEvents.Where(e => e.CreatedAt >= thirtyAgo).ToList();
        var byDay = daySource
            .GroupBy(e => e.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new { label = g.Key.ToString("dd/MM"), value = g.Sum(e => e.Budget) })
            .ToList();

        // By week — last 12 weeks or filtered month
        var twelveWeeksAgo = now.Date.AddDays(-84);
        var weekSource = fStart.HasValue
            ? filtEvents
            : allEvents.Where(e => e.CreatedAt >= twelveWeeksAgo).ToList();
        var byWeek = weekSource
            .GroupBy(e => WeekStart(e.CreatedAt))
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                label = $"{g.Key:dd/MM} - {g.Key.AddDays(6):dd/MM}",
                value = g.Sum(e => e.Budget)
            })
            .ToList();

        // By payment method
        var pmTotal  = filtPayments.Sum(p => p.Amount);
        var byMethod = filtPayments
            .GroupBy(p => p.Method)
            .Select(g => new
            {
                method = g.Key,
                label  = g.Key switch
                {
                    "transfer" => "Transferencia",
                    "cash"     => "Efectivo",
                    "card"     => "Tarjeta",
                    "check"    => "Cheque",
                    _          => g.Key
                },
                value = g.Sum(p => p.Amount),
                pct   = pmTotal > 0
                    ? Math.Round(g.Sum(p => p.Amount) / pmTotal * 100m, 1)
                    : 0m
            })
            .OrderByDescending(x => x.value)
            .ToList();

        return Ok(new { todaySales, totalSales, totalPayments, dailyAverage, totalEvents, byMonth, byDay, byWeek, byMethod });
    }

    [HttpGet("meses")]
    public async Task<IActionResult> GetMeses()
    {
        var orgId = OrgId;
        var raw = await db.Events
            .Where(e => e.OrgId == orgId)
            .Select(e => new { e.CreatedAt.Year, e.CreatedAt.Month })
            .ToListAsync();

        var meses = raw
            .DistinctBy(d => new { d.Year, d.Month })
            .OrderByDescending(d => d.Year).ThenByDescending(d => d.Month)
            .Select(d => new { value = $"{d.Year}-{d.Month:D2}", label = $"{d.Month:D2}/{d.Year}" })
            .ToList();

        return Ok(meses);
    }
}
