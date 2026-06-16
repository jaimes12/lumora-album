using lumora_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/plans")]
public class PlansController(LumoraDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await db.PlanConfigs
            .OrderBy(p => p.SortOrder)
            .ToListAsync();

        var result = plans.Select(p => new
        {
            id       = p.PlanId,
            name     = p.Name,
            price    = p.Price,
            desc     = p.Description,
            color    = p.Color,
            popular  = p.Popular,
            features = JsonSerializer.Deserialize<object>(p.FeaturesJson),
        });

        return Ok(result);
    }
}
