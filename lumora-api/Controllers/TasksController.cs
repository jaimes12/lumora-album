using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController(ITaskService tasks) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? "";

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await tasks.GetAllAsync(OrgId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest req)
        => Ok(await tasks.CreateAsync(OrgId, req));

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(string id)
    {
        await tasks.ToggleAsync(OrgId, id);
        return Ok(new { ok = true });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await tasks.DeleteAsync(OrgId, id);
        return Ok(new { ok = true });
    }
}
