using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface IWhatsappService
{
    Task<ChatResponse> CreateChatAsync(string orgId, CreateChatRequest req);
    Task<ChatResponse?> GetChatByIdAsync(string orgId, string id);
    Task<IEnumerable<ChatResponse>> GetChatsByOrgAsync(string orgId, string? status = null);
    Task<ChatResponse?> UpdateChatAsync(string orgId, string id, UpdateChatRequest req);
    Task<bool> DeleteChatAsync(string orgId, string id);

    Task<MessageResponse> SendMessageAsync(string orgId, string chatId, SendMessageRequest req);
    Task<IEnumerable<MessageResponse>> GetMessagesAsync(string orgId, string chatId);
}

public class WhatsappService(LumoraDbContext db) : IWhatsappService
{
    public async Task<ChatResponse> CreateChatAsync(string orgId, CreateChatRequest req)
    {
        var chat = new WhatsappChat
        {
            Id = Guid.NewGuid().ToString(),
            OrgId = orgId,
            Phone = req.Phone,
            ContactName = req.ContactName,
            ClientId = req.ClientId,
            Status = "open",
            CreatedAt = DateTime.UtcNow
        };
        await db.WhatsappChats.AddAsync(chat);
        await db.SaveChangesAsync();
        return ToChatResponse(chat);
    }

    public async Task<ChatResponse?> GetChatByIdAsync(string orgId, string id)
    {
        var chat = await db.WhatsappChats.FirstOrDefaultAsync(c => c.Id == id && c.OrgId == orgId);
        return chat is null ? null : ToChatResponse(chat);
    }

    public async Task<IEnumerable<ChatResponse>> GetChatsByOrgAsync(string orgId, string? status = null)
    {
        var query = db.WhatsappChats.Where(c => c.OrgId == orgId);
        if (status is not null) query = query.Where(c => c.Status == status);
        var list = await query.OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt).ToListAsync();
        return list.Select(ToChatResponse);
    }

    public async Task<ChatResponse?> UpdateChatAsync(string orgId, string id, UpdateChatRequest req)
    {
        var chat = await db.WhatsappChats.FirstOrDefaultAsync(c => c.Id == id && c.OrgId == orgId);
        if (chat is null) return null;

        if (req.ContactName is not null) chat.ContactName = req.ContactName;
        if (req.Status is not null) chat.Status = req.Status;
        if (req.ClientId is not null) chat.ClientId = req.ClientId;

        await db.SaveChangesAsync();
        return ToChatResponse(chat);
    }

    public async Task<bool> DeleteChatAsync(string orgId, string id)
    {
        var chat = await db.WhatsappChats.FirstOrDefaultAsync(c => c.Id == id && c.OrgId == orgId);
        if (chat is null) return false;
        db.WhatsappChats.Remove(chat);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<MessageResponse> SendMessageAsync(string orgId, string chatId, SendMessageRequest req)
    {
        var chat = await db.WhatsappChats.FirstOrDefaultAsync(c => c.Id == chatId && c.OrgId == orgId)
            ?? throw new KeyNotFoundException("Chat not found");

        var message = new WhatsappMessage
        {
            Id = Guid.NewGuid().ToString(),
            ChatId = chatId,
            OrgId = orgId,
            Direction = "outbound",
            Body = req.Body,
            MediaUrl = req.MediaUrl,
            Status = "sent",
            SentAt = DateTime.UtcNow
        };

        chat.LastMessageAt = message.SentAt;

        await db.WhatsappMessages.AddAsync(message);
        await db.SaveChangesAsync();
        return ToMessageResponse(message);
    }

    public async Task<IEnumerable<MessageResponse>> GetMessagesAsync(string orgId, string chatId)
    {
        // Verify chat belongs to org
        var chatExists = await db.WhatsappChats.AnyAsync(c => c.Id == chatId && c.OrgId == orgId);
        if (!chatExists) return [];

        var list = await db.WhatsappMessages
            .Where(m => m.ChatId == chatId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();
        return list.Select(ToMessageResponse);
    }

    private static ChatResponse ToChatResponse(WhatsappChat c) => new(
        c.Id, c.Phone, c.ContactName, c.ClientId,
        c.Status, c.LastMessageAt, c.CreatedAt
    );

    private static MessageResponse ToMessageResponse(WhatsappMessage m) => new(
        m.Id, m.ChatId, m.Direction, m.Body,
        m.MediaUrl, m.Status, m.SentAt
    );
}
