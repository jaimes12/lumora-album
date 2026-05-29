using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record CreateChatRequest(
    [Required] string Phone,
    string? ContactName,
    string? ClientId
);

public record UpdateChatRequest(
    string? ContactName,
    string? Status,
    string? ClientId
);

public record ChatResponse(
    string Id,
    string Phone,
    string? ContactName,
    string? ClientId,
    string Status,
    DateTime? LastMessageAt,
    DateTime CreatedAt
);

public record SendMessageRequest(
    [Required] string Body,
    string? MediaUrl
);

public record MessageResponse(
    string Id,
    string ChatId,
    string Direction,
    string Body,
    string? MediaUrl,
    string Status,
    DateTime SentAt
);
