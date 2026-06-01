using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContractsController(IContractService contracts) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status) =>
        Ok(await contracts.GetByOrgAsync(OrgId, status));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var c = await contracts.GetByIdAsync(OrgId, id);
        return c is null ? NotFound() : Ok(c);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContractRequest req)
    {
        var c = await contracts.CreateAsync(OrgId, req);
        return CreatedAtAction(nameof(GetById), new { id = c.Id }, c);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateContractRequest req)
    {
        var c = await contracts.UpdateAsync(OrgId, id, req);
        return c is null ? NotFound() : Ok(c);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id) =>
        await contracts.DeleteAsync(OrgId, id) ? NoContent() : NotFound();
}
