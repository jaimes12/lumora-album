using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController(ILeadService leads, LumoraDbContext db) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? stage) =>
        Ok(await leads.GetByOrgAsync(OrgId, stage));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var l = await leads.GetByIdAsync(OrgId, id);
        return l is null ? NotFound() : Ok(l);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadRequest req)
    {
        var l = await leads.CreateAsync(OrgId, req);
        return CreatedAtAction(nameof(GetById), new { id = l.Id }, l);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateLeadRequest req)
    {
        var l = await leads.UpdateAsync(OrgId, id, req);
        return l is null ? NotFound() : Ok(l);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id) =>
        await leads.DeleteAsync(OrgId, id) ? NoContent() : NotFound();

    [HttpDelete]
    public async Task<IActionResult> DeleteAll()
    {
        var count = await leads.DeleteAllAsync(OrgId);
        return Ok(new { deleted = count });
    }

    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(string id, [FromBody] SendLeadMessageRequest req)
    {
        var msg = await leads.SendMessageAsync(OrgId, id, req);
        return msg is null ? NotFound() : Ok(msg);
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == id && l.OrgId == OrgId);
        if (lead is null) return NotFound();

        lead.UnreadCount = 0;
        await db.SaveChangesAsync();
        return Ok(new { id, unreadCount = 0 });
    }
}
