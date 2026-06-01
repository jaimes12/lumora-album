using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/sales")]
[Authorize]
public class SalesController(ISaleService sales) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status) =>
        Ok(await sales.GetByOrgAsync(OrgId, status));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var s = await sales.GetByIdAsync(OrgId, id);
        return s is null ? NotFound() : Ok(s);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSaleRequest req)
    {
        var s = await sales.CreateAsync(OrgId, req);
        return CreatedAtAction(nameof(GetById), new { id = s.Id }, s);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateSaleRequest req)
    {
        var s = await sales.UpdateAsync(OrgId, id, req);
        return s is null ? NotFound() : Ok(s);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id) =>
        await sales.DeleteAsync(OrgId, id) ? NoContent() : NotFound();
}
