using lumora_api.Data;
using lumora_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/pipeline-stages")]
[Authorize]
public class PipelineStagesController(LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var stages = await db.PipelineStages
            .Where(s => s.OrgId == OrgId)
            .OrderBy(s => s.SortOrder)
            .ToListAsync();
        return Ok(stages.Select(s => new { s.Id, s.Label, s.Color, s.SortOrder }));
    }

    // Replaces all stages for this org with the provided list
    [HttpPut]
    public async Task<IActionResult> SaveAll([FromBody] List<StageDto> stages)
    {
        var existing = await db.PipelineStages
            .Where(s => s.OrgId == OrgId)
            .ToListAsync();
        db.PipelineStages.RemoveRange(existing);

        for (var i = 0; i < stages.Count; i++)
        {
            var dto = stages[i];
            db.PipelineStages.Add(new PipelineStage
            {
                Id        = string.IsNullOrEmpty(dto.Id) ? Guid.NewGuid().ToString() : dto.Id,
                OrgId     = OrgId,
                Label     = dto.Label,
                Color     = dto.Color,
                SortOrder = i,
            });
        }

        await db.SaveChangesAsync();
        return Ok();
    }
}

public record StageDto(string? Id, string Label, string Color);
