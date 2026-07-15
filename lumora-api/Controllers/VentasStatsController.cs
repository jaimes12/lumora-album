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

    private async Task<bool> IsTravelOrgAsync(string orgId) =>
        await db.Organizations.Where(o => o.Id == orgId).Select(o => o.Industry).FirstOrDefaultAsync() == "travel";

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string? mes = null)
    {
        var now      = DateTime.UtcNow;
        var orgId    = OrgId;
        var isTravel = await IsTravelOrgAsync(orgId);

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

        // "Sale" = a passenger reservation for travel orgs (counted as soon as it's added,
        // regardless of payment status), or an event's budget for events orgs.
        List<(DateTime CreatedAt, decimal Amount)> allSales;
        List<(DateTime PaidAt, decimal Amount, string Method)> allPayments;

        if (isTravel)
        {
            allSales = (await db.TripPassengers
                .Where(p => p.OrgId == orgId && p.Trip!.Status != "cancelado")
                .Select(p => new { p.CreatedAt, p.TotalCost })
                .ToListAsync())
                .Select(r => (r.CreatedAt, r.TotalCost))
                .ToList();

            allPayments = (await db.TripPayments
                .Where(p => p.OrgId == orgId)
                .Select(p => new { p.PaidAt, p.Amount, p.Method })
                .ToListAsync())
                .Select(r => (r.PaidAt, r.Amount, r.Method))
                .ToList();
        }
        else
        {
            allSales = (await db.Events
                .Where(e => e.OrgId == orgId && e.Status != "cancelled")
                .Select(e => new { e.CreatedAt, e.Budget })
                .ToListAsync())
                .Select(r => (r.CreatedAt, r.Budget))
                .ToList();

            allPayments = (await db.EventPayments
                .Where(p => p.OrgId == orgId)
                .Select(p => new { p.PaidAt, p.Amount, p.Method })
                .ToListAsync())
                .Select(r => (r.PaidAt, r.Amount, r.Method))
                .ToList();
        }

        var filtSales    = fStart.HasValue
            ? allSales.Where(e => e.CreatedAt >= fStart && e.CreatedAt < fEnd).ToList()
            : allSales;
        var filtPayments = fStart.HasValue
            ? allPayments.Where(p => p.PaidAt >= fStart && p.PaidAt < fEnd).ToList()
            : allPayments;

        var todaySales    = allSales.Where(e => e.CreatedAt.Date == now.Date).Sum(e => e.Amount);
        var totalSales    = filtSales.Sum(e => e.Amount);
        var totalPayments = filtPayments.Sum(p => p.Amount);
        var totalCount    = filtSales.Count;

        var dailyAverage = allPayments
            .Where(p => p.PaidAt.Year == now.Year && p.PaidAt.Month == now.Month)
            .Sum(p => p.Amount) / (decimal)DateTime.DaysInMonth(now.Year, now.Month);

        // By month — all 12 months of current year, zero-filled
        // Use .Year property comparison to avoid DateTimeKind mismatch with Pomelo
        var currentYear = now.Year;
        var monthLabels = new[] { "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic" };
        var byMonthDict = allSales
            .Where(e => e.CreatedAt.Year == currentYear)
            .GroupBy(e => e.CreatedAt.Month)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));
        var byMonth = Enumerable.Range(1, 12).Select(m => new {
            label = monthLabels[m - 1],
            value = byMonthDict.TryGetValue(m, out var v) ? v : 0m
        }).ToList();

        // By day — last 30 days of current year, or filtered month
        var thirtyAgoDate = now.Date.AddDays(-30);
        var daySource = fStart.HasValue
            ? filtSales
            : allSales.Where(e => e.CreatedAt.Year == currentYear && e.CreatedAt.Date >= thirtyAgoDate).ToList();
        var byDay = daySource
            .GroupBy(e => e.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new { label = g.Key.ToString("dd/MM"), value = g.Sum(e => e.Amount) })
            .ToList();

        // By week — current year or filtered month (same Year trick to avoid Kind issues)
        var weekSource = fStart.HasValue
            ? filtSales
            : allSales.Where(e => e.CreatedAt.Year == currentYear).ToList();
        var byWeek = weekSource
            .GroupBy(e => WeekStart(e.CreatedAt))
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                label = $"{g.Key:dd/MM} - {g.Key.AddDays(6):dd/MM}",
                value = g.Sum(e => e.Amount)
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
                    "oxxo"     => "OXXO",
                    _          => g.Key
                },
                value = g.Sum(p => p.Amount),
                pct   = pmTotal > 0
                    ? Math.Round(g.Sum(p => p.Amount) / pmTotal * 100m, 1)
                    : 0m
            })
            .OrderByDescending(x => x.value)
            .ToList();

        return Ok(new {
            industry = isTravel ? "travel" : "events",
            todaySales, totalSales, totalPayments, dailyAverage,
            totalEvents = totalCount,
            byMonth, byDay, byWeek, byMethod
        });
    }

    [HttpGet("meses")]
    public async Task<IActionResult> GetMeses()
    {
        var orgId    = OrgId;
        var isTravel = await IsTravelOrgAsync(orgId);

        List<(int Year, int Month)> raw = isTravel
            ? (await db.TripPassengers
                .Where(p => p.OrgId == orgId)
                .Select(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                .ToListAsync())
                .Select(d => (d.Year, d.Month)).ToList()
            : (await db.Events
                .Where(e => e.OrgId == orgId)
                .Select(e => new { e.CreatedAt.Year, e.CreatedAt.Month })
                .ToListAsync())
                .Select(d => (d.Year, d.Month)).ToList();

        var meses = raw
            .DistinctBy(d => (d.Year, d.Month))
            .OrderByDescending(d => d.Year).ThenByDescending(d => d.Month)
            .Select(d => new { value = $"{d.Year}-{d.Month:D2}", label = $"{d.Month:D2}/{d.Year}" })
            .ToList();

        return Ok(meses);
    }
}
