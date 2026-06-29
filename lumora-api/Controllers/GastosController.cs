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

        var gastos = await q
            .OrderByDescending(g => g.Fecha)
            .Select(g => new {
                g.Id,
                g.EventId,
                g.Descripcion,
                g.Monto,
                g.Categoria,
                fecha = g.Fecha,
                g.Notas,
                g.CreatedAt,
                eventoNombre = g.Event != null ? g.Event.Name : (string?)null,
            })
            .ToListAsync();

        return Ok(gastos);
    }

    [HttpGet("ingresos")]
    public async Task<IActionResult> GetIngresos([FromQuery] string? desde, [FromQuery] string? hasta)
    {
        var q = db.EventPayments
            .Where(p => p.OrgId == OrgId)
            .Include(p => p.Event)
                .ThenInclude(e => e!.Client);

        var payments = await q.OrderByDescending(p => p.PaidAt).ToListAsync();

        var result = payments.Select(p => new {
            p.Id,
            p.EventId,
            eventoNombre = p.Event?.Name ?? "",
            clienteNombre = p.Event?.Client?.Name ?? "",
            concepto = p.Concept,
            monto = p.Amount,
            metodo = p.Method,
            fecha = p.PaidAt,
            p.CreatedAt,
        });

        if (!string.IsNullOrEmpty(desde) && DateTime.TryParse(desde, out var d))
            result = result.Where(p => p.fecha >= d);
        if (!string.IsNullOrEmpty(hasta) && DateTime.TryParse(hasta, out var h))
            result = result.Where(p => p.fecha < h.AddDays(1));

        return Ok(result.ToList());
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
            var ev = await db.Events.FindAsync(gasto.EventId);
            eventoNombre = ev?.Name;
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

        if (req.Descripcion is not null) gasto.Descripcion = req.Descripcion;
        if (req.Monto != 0) gasto.Monto = req.Monto;
        if (req.Categoria is not null) gasto.Categoria = req.Categoria;
        if (req.Fecha.HasValue) gasto.Fecha = req.Fecha.Value;
        if (req.Notas is not null) gasto.Notas = req.Notas;
        if (req.EventId is not null) gasto.EventId = string.IsNullOrEmpty(req.EventId) ? null : req.EventId;

        await db.SaveChangesAsync();

        string? eventoNombre = null;
        if (gasto.EventId != null)
        {
            var ev = await db.Events.FindAsync(gasto.EventId);
            eventoNombre = ev?.Name;
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
    string Descripcion,
    decimal Monto,
    string? Categoria,
    DateTime? Fecha,
    string? Notas
);
