using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VendorsController(IVendorService vendors) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category) =>
        Ok(await vendors.GetByOrgAsync(OrgId, category));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var v = await vendors.GetByIdAsync(OrgId, id);
        return v is null ? NotFound() : Ok(v);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVendorRequest req)
    {
        var v = await vendors.CreateAsync(OrgId, req);
        return CreatedAtAction(nameof(GetById), new { id = v.Id }, v);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateVendorRequest req)
    {
        var v = await vendors.UpdateAsync(OrgId, id, req);
        return v is null ? NotFound() : Ok(v);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id) =>
        await vendors.DeleteAsync(OrgId, id) ? NoContent() : NotFound();
}
