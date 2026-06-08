using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class ProductsController(IProductService products) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? "";

    // ── Catalog ──────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetCatalog() =>
        Ok(await products.GetCatalogAsync(OrgId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrgProductRequest req) =>
        Ok(await products.CreateCatalogItemAsync(OrgId, req));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateOrgProductRequest req)
    {
        var result = await products.UpdateCatalogItemAsync(OrgId, id, req);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var ok = await products.DeleteCatalogItemAsync(OrgId, id);
        return ok ? Ok(new { ok = true }) : NotFound();
    }

    // ── Event products ────────────────────────────────────────────────────────

    [HttpGet("event/{eventId}")]
    public async Task<IActionResult> GetEventProducts(string eventId) =>
        Ok(await products.GetEventProductsAsync(OrgId, eventId));

    [HttpPost("event/{eventId}")]
    public async Task<IActionResult> AddEventProduct(string eventId, [FromBody] AddEventProductRequest req) =>
        Ok(await products.AddEventProductAsync(OrgId, eventId, req));

    [HttpPut("event-item/{id}")]
    public async Task<IActionResult> UpdateEventProduct(string id, [FromBody] UpdateEventProductRequest req)
    {
        var result = await products.UpdateEventProductAsync(OrgId, id, req);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("event-item/{id}")]
    public async Task<IActionResult> DeleteEventProduct(string id)
    {
        var ok = await products.DeleteEventProductAsync(OrgId, id);
        return ok ? Ok(new { ok = true }) : NotFound();
    }
}
