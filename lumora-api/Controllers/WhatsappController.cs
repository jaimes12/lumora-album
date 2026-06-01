using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/whatsapp")]
[Authorize]
public class WhatsappController(IWhatsappService whatsapp) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;

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
