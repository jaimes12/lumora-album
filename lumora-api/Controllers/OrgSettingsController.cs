using lumora_api.Data;
using lumora_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/org-settings")]
[Authorize]
public class OrgSettingsController(LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var s = await db.OrgSettings.FirstOrDefaultAsync(x => x.OrgId == OrgId);
        return Ok(new
        {
            companyName  = s?.CompanyName  ?? string.Empty,
            rfc          = s?.Rfc          ?? string.Empty,
            directorName = s?.DirectorName ?? string.Empty,
            phone        = s?.Phone        ?? string.Empty,
            email        = s?.Email        ?? string.Empty,
            city         = s?.City         ?? string.Empty,
            address      = s?.Address      ?? string.Empty,
        });
    }

    [HttpPut]
    public async Task<IActionResult> Upsert([FromBody] OrgSettingsDto dto)
    {
        var s = await db.OrgSettings.FirstOrDefaultAsync(x => x.OrgId == OrgId);
        if (s is null) { s = new OrgSettings { OrgId = OrgId }; db.OrgSettings.Add(s); }
        s.CompanyName  = dto.CompanyName  ?? string.Empty;
        s.Rfc          = dto.Rfc          ?? string.Empty;
        s.DirectorName = dto.DirectorName ?? string.Empty;
        s.Phone        = dto.Phone        ?? string.Empty;
        s.Email        = dto.Email        ?? string.Empty;
        s.City         = dto.City         ?? string.Empty;
        s.Address      = dto.Address      ?? string.Empty;
        await db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

public record OrgSettingsDto(
    string? CompanyName,
    string? Rfc,
    string? DirectorName,
    string? Phone,
    string? Email,
    string? City,
    string? Address
);
