using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientsController(IClientService clients) : ControllerBase
{
    private string OrgId => User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? stage) =>
        Ok(await clients.GetByOrgAsync(OrgId, stage));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var c = await clients.GetByIdAsync(OrgId, id);
        return c is null ? NotFound() : Ok(c);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClientRequest req)
    {
        var c = await clients.CreateAsync(OrgId, req);
        return CreatedAtAction(nameof(GetById), new { id = c.Id }, c);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateClientRequest req)
    {
        var c = await clients.UpdateAsync(OrgId, id, req);
        return c is null ? NotFound() : Ok(c);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id) =>
        await clients.DeleteAsync(OrgId, id) ? NoContent() : NotFound();
}
