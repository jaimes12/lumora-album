using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController(IEventService events) : ControllerBase
{
    private string OrgId => User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status) =>
        Ok(await events.GetByOrgAsync(OrgId, status));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var ev = await events.GetByIdAsync(OrgId, id);
        return ev is null ? NotFound() : Ok(ev);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventRequest req)
    {
        var ev = await events.CreateAsync(OrgId, req);
        return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateEventRequest req)
    {
        var ev = await events.UpdateAsync(OrgId, id, req);
        return ev is null ? NotFound() : Ok(ev);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id) =>
        await events.DeleteAsync(OrgId, id) ? NoContent() : NotFound();
}
