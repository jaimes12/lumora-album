using lumora_api.Data;
using lumora_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/gastos")]
[Authorize]
public class GastosController(LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? desde, [FromQuery] string? hasta)
    {
        var q = db.Gastos.Where(g => g.OrgId == OrgId);

        if (!string.IsNullOrEmpty(desde) && DateTime.TryParse(desde, out var d))
            q = q.Where(g => g.Fecha >= d);
        if (!string.IsNullOrEmpty(hasta) && DateTime.TryParse(hasta, out var h))
            q = q.Where(g => g.Fecha < h.AddDays(1));

        // Avoid navigation property access in projection (Pomelo GUID cast issue)
        var gastos = await q
            .OrderByDescending(g => g.Fecha)
            .Select(g => new { g.Id, g.EventId, g.Descripcion, g.Monto, g.Categoria, g.Fecha, g.Notas, g.CreatedAt })
            .ToListAsync();

        // Batch-fetch event names separately
        var eventIds = gastos.Select(g => g.EventId).Where(id => id != null).Distinct().ToList();
        var eventNames = await db.Events
            .Where(e => eventIds.Contains(e.Id))
            .Select(e => new { e.Id, e.Name })
            .ToDictionaryAsync(e => e.Id, e => e.Name);

        return Ok(gastos.Select(g => new {
            g.Id, g.EventId, g.Descripcion, g.Monto, g.Categoria,
            g.Fecha, g.Notas, g.CreatedAt,
            eventoNombre = g.EventId != null && eventNames.TryGetValue(g.EventId, out var n) ? n : null,
        }));
    }

    [HttpGet("ingresos")]
    public async Task<IActionResult> GetIngresos([FromQuery] string? desde, [FromQuery] string? hasta)
    {
        // Avoid Include/ThenInclude — Pomelo GUID cast issues (same pattern as EventService)
        var q = db.EventPayments.Where(p => p.OrgId == OrgId);

        if (!string.IsNullOrEmpty(desde) && DateTime.TryParse(desde, out var d))
            q = q.Where(p => p.PaidAt >= d);
        if (!string.IsNullOrEmpty(hasta) && DateTime.TryParse(hasta, out var h))
            q = q.Where(p => p.PaidAt < h.AddDays(1));

        var payments = await q
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new { p.Id, p.EventId, p.Concept, p.Amount, p.Method, p.PaidAt, p.CreatedAt })
            .ToListAsync();

        // Batch-fetch event and client info separately
        var evIds = payments.Select(p => p.EventId).Distinct().ToList();
        var events = await db.Events
            .Where(e => evIds.Contains(e.Id))
            .Select(e => new { e.Id, e.Name, e.ClientId })
            .ToDictionaryAsync(e => e.Id);

        var clientIds = events.Values.Select(e => e.ClientId).Distinct().ToList();
        var clients = await db.Clients
            .Where(c => clientIds.Contains(c.Id))
            .Select(c => new { c.Id, c.Name })
            .ToDictionaryAsync(c => c.Id, c => c.Name);

        var result = payments.Select(p => {
            events.TryGetValue(p.EventId, out var ev);
            var clientName = ev != null && clients.TryGetValue(ev.ClientId, out var cn) ? cn : "";
            return new {
                p.Id, p.EventId,
                eventoNombre  = ev?.Name ?? "",
                clienteNombre = clientName,
                concepto = p.Concept,
                monto    = p.Amount,
                metodo   = p.Method,
                fecha    = p.PaidAt,
                p.CreatedAt,
            };
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GastoRequest req)
    {
        var gasto = new Gasto
        {
            Id          = Guid.NewGuid().ToString(),
            OrgId       = OrgId,
            EventId     = string.IsNullOrEmpty(req.EventId) ? null : req.EventId,
            Descripcion = req.Descripcion,
            Monto       = req.Monto,
            Categoria   = req.Categoria ?? "general",
            Fecha       = req.Fecha ?? DateTime.UtcNow,
            Notas       = req.Notas,
            CreatedAt   = DateTime.UtcNow,
        };
        db.Gastos.Add(gasto);
        await db.SaveChangesAsync();

        string? eventoNombre = null;
        if (gasto.EventId != null)
        {
            eventoNombre = await db.Events
                .Where(e => e.Id == gasto.EventId)
                .Select(e => e.Name)
                .FirstOrDefaultAsync();
        }

        return Ok(new {
            gasto.Id, gasto.EventId, gasto.Descripcion, gasto.Monto,
            gasto.Categoria, fecha = gasto.Fecha, gasto.Notas, gasto.CreatedAt,
            eventoNombre,
        });
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] GastoRequest req)
    {
        var gasto = await db.Gastos.FirstOrDefaultAsync(g => g.Id == id && g.OrgId == OrgId);
        if (gasto is null) return NotFound();

        if (!string.IsNullOrEmpty(req.Descripcion)) gasto.Descripcion = req.Descripcion;
        if (req.Monto != 0)                         gasto.Monto       = req.Monto;
        if (req.Categoria is not null)              gasto.Categoria   = req.Categoria;
        if (req.Fecha.HasValue)                     gasto.Fecha       = req.Fecha.Value;
        if (req.Notas is not null)                  gasto.Notas       = req.Notas;
        if (req.EventId is not null)                gasto.EventId     = string.IsNullOrEmpty(req.EventId) ? null : req.EventId;

        await db.SaveChangesAsync();

        string? eventoNombre = null;
        if (gasto.EventId != null)
        {
            eventoNombre = await db.Events
                .Where(e => e.Id == gasto.EventId)
                .Select(e => e.Name)
                .FirstOrDefaultAsync();
        }

        return Ok(new {
            gasto.Id, gasto.EventId, gasto.Descripcion, gasto.Monto,
            gasto.Categoria, fecha = gasto.Fecha, gasto.Notas, gasto.CreatedAt,
            eventoNombre,
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var gasto = await db.Gastos.FirstOrDefaultAsync(g => g.Id == id && g.OrgId == OrgId);
        if (gasto is null) return NotFound();
        db.Gastos.Remove(gasto);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record GastoRequest(
    string? EventId,
    string? Descripcion,
    decimal Monto,
    string? Categoria,
    DateTime? Fecha,
    string? Notas
);
