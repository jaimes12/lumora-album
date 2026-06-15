using System.Security.Cryptography;
using System.Text;
using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/workers")]
[Authorize]
public class WorkersController(LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? string.Empty;
    // Fallback to "admin" for existing sessions issued before the role claim was added
    private string UserRole =>
        User.FindFirst("role")?.Value ??
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ??
        "admin";

    private static readonly Dictionary<string, int> PlanMaxWorkers = new()
    {
        ["free"]    = 0,
        ["solo"]    = 2,
        ["negocio"] = 5,
        ["agencia"] = 15,
    };

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (UserRole != "admin") return Forbid();
        var workers = await db.Users
            .Where(u => u.OrgId == OrgId && u.Role == "member")
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new { u.Id, u.Name, u.Email, u.Phone, u.CreatedAt })
            .ToListAsync();
        return Ok(workers);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkerRequest req)
    {
        if (UserRole != "admin") return Forbid();

        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == OrgId);
        var plan = org?.Plan ?? "free";
        var maxWorkers = PlanMaxWorkers.GetValueOrDefault(plan, 0);

        var currentWorkers = await db.Users.CountAsync(u => u.OrgId == OrgId && u.Role == "member");
        if (currentWorkers >= maxWorkers)
            return StatusCode(402, new { error = "plan_limit", message = $"Tu plan permite máximo {maxWorkers} trabajador(es). Actualiza tu plan para agregar más." });

        var exists = await db.Users.AnyAsync(u => u.Email == req.Email);
        if (exists) return Conflict(new { message = "El correo ya está registrado" });

        var worker = new User
        {
            Id           = Guid.NewGuid().ToString(),
            OrgId        = OrgId,
            Name         = req.Name.Trim(),
            Email        = req.Email.Trim().ToLower(),
            Phone        = req.Phone?.Trim(),
            Role         = "member",
            PasswordHash = HashPassword(req.Password),
            CreatedAt    = DateTime.UtcNow,
        };
        await db.Users.AddAsync(worker);
        await db.SaveChangesAsync();

        return Ok(new { worker.Id, worker.Name, worker.Email, worker.Phone, worker.CreatedAt });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateWorkerRequest req)
    {
        if (UserRole != "admin") return Forbid();
        var worker = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.OrgId == OrgId && u.Role == "member");
        if (worker is null) return NotFound();

        worker.Name  = req.Name.Trim();
        worker.Phone = req.Phone?.Trim();
        if (!string.IsNullOrEmpty(req.Password))
            worker.PasswordHash = HashPassword(req.Password);

        await db.SaveChangesAsync();
        return Ok(new { worker.Id, worker.Name, worker.Email, worker.Phone });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (UserRole != "admin") return Forbid();
        var worker = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.OrgId == OrgId && u.Role == "member");
        if (worker is null) return NotFound();
        db.Users.Remove(worker);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string HashPassword(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            saltBytes, 100000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(saltBytes)}:{Convert.ToBase64String(hashBytes)}";
    }
}
