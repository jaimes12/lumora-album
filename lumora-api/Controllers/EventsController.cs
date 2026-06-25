using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController(IEventService events, IR2Service r2) : ControllerBase
{
    private string OrgId    => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;
    private string? UserId  => User.FindFirst("user_id")?.Value;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? clientId) =>
        Ok(await events.GetByOrgAsync(OrgId, status, clientId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var ev = await events.GetByIdAsync(OrgId, id);
        return ev is null ? NotFound() : Ok(ev);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventRequest req)
    {
        try
        {
            var ev = await events.CreateAsync(OrgId, UserId, req);
            return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
        }
        catch (InvalidOperationException ex) when (ex.Message.StartsWith("PLAN_LIMIT"))
        {
            return StatusCode(402, new { error = "plan_limit", message = ex.Message });
        }
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

    [HttpPost("{id}/payments")]
    public async Task<IActionResult> AddPayment(string id, [FromBody] CreatePaymentRequest req)
    {
        var ev = await events.GetByIdAsync(OrgId, id);
        if (ev is null) return NotFound();
        var payment = await events.AddPaymentAsync(OrgId, id, req);
        return Ok(payment);
    }

    [HttpDelete("{id}/payments/{paymentId}")]
    public async Task<IActionResult> DeletePayment(string id, string paymentId) =>
        await events.DeletePaymentAsync(OrgId, id, paymentId) ? NoContent() : NotFound();

    [HttpPatch("{id}/payments/{paymentId}")]
    public async Task<IActionResult> UpdatePayment(string id, string paymentId, [FromBody] UpdatePaymentRequest req)
    {
        var payment = await events.UpdatePaymentAsync(OrgId, id, paymentId, req);
        return payment is null ? NotFound() : Ok(payment);
    }

    // ── Photos ─────────────────────────────────────────────────────────────────
    [HttpGet("{id}/photos")]
    public async Task<IActionResult> GetPhotos(string id) =>
        Ok(await events.GetPhotosAsync(OrgId, id));

    [HttpPost("{id}/photos")]
    public async Task<IActionResult> AddPhoto(string id, [FromBody] AddEventPhotoRequest req)
    {
        var photo = await events.AddPhotoAsync(OrgId, id, req, r2);
        return photo is null ? BadRequest(new { error = "No se pudo subir la imagen" }) : Ok(photo);
    }

    [HttpDelete("{id}/photos/{photoId}")]
    public async Task<IActionResult> DeletePhoto(string id, string photoId) =>
        await events.DeletePhotoAsync(OrgId, id, photoId) ? NoContent() : NotFound();
}
