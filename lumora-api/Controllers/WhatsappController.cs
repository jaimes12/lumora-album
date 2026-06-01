using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/whatsapp")]
[Authorize]
public class WhatsappController(IWhatsappService whatsapp, IWaServerService waServer, ILeadService leads) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;

    // ── Inbound webhook (called by WA server, no auth) ────

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook([FromBody] WaWebhookPayload payload)
    {
        if (string.IsNullOrWhiteSpace(payload.Body)) return Ok();
        if (!payload.ClientName.StartsWith("lm_")) return Ok();
        if (payload.From.EndsWith("@g.us")) return Ok(); // skip groups

        // lm_ba22ec7e_6745_4a8f_9c89_9a9e0f954474 → ba22ec7e-6745-4a8f-9c89-9a9e0f954474
        var orgId = payload.ClientName[3..].Replace('_', '-');

        await leads.HandleInboundAsync(orgId, payload.From, payload.Body);
        return Ok();
    }

    // ── WA Number Connection ───────────────────────────────

    [HttpGet("connection")]
    public async Task<IActionResult> GetConnection() =>
        Ok(await waServer.GetStatusAsync(OrgId));

    [HttpPost("connection/connect")]
    public async Task<IActionResult> Connect()
    {
        await waServer.ConnectAsync(OrgId);
        return Accepted();
    }

    [HttpPost("connection/disconnect")]
    public async Task<IActionResult> Disconnect()
    {
        await waServer.DisconnectAsync(OrgId);
        return Ok(new { ok = true });
    }

    // ── Chats ──────────────────────────────────────────────

    [HttpGet("chats")]
    public async Task<IActionResult> GetChats([FromQuery] string? status) =>
        Ok(await whatsapp.GetChatsByOrgAsync(OrgId, status));

    [HttpGet("chats/{id}")]
    public async Task<IActionResult> GetChat(string id)
    {
        var c = await whatsapp.GetChatByIdAsync(OrgId, id);
        return c is null ? NotFound() : Ok(c);
    }

    [HttpPost("chats")]
    public async Task<IActionResult> CreateChat([FromBody] CreateChatRequest req)
    {
        var c = await whatsapp.CreateChatAsync(OrgId, req);
        return CreatedAtAction(nameof(GetChat), new { id = c.Id }, c);
    }

    [HttpPatch("chats/{id}")]
    public async Task<IActionResult> UpdateChat(string id, [FromBody] UpdateChatRequest req)
    {
        var c = await whatsapp.UpdateChatAsync(OrgId, id, req);
        return c is null ? NotFound() : Ok(c);
    }

    [HttpDelete("chats/{id}")]
    public async Task<IActionResult> DeleteChat(string id) =>
        await whatsapp.DeleteChatAsync(OrgId, id) ? NoContent() : NotFound();

    // ── Messages ───────────────────────────────────────────

    [HttpGet("chats/{chatId}/messages")]
    public async Task<IActionResult> GetMessages(string chatId) =>
        Ok(await whatsapp.GetMessagesAsync(OrgId, chatId));

    [HttpPost("chats/{chatId}/messages")]
    public async Task<IActionResult> SendMessage(string chatId, [FromBody] SendMessageRequest req)
    {
        try
        {
            var m = await whatsapp.SendMessageAsync(OrgId, chatId, req);
            return CreatedAtAction(nameof(GetMessages), new { chatId }, m);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
