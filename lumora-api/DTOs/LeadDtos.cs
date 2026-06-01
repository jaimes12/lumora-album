using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record CreateLeadRequest(
    [Required] string Name,
    [Required] string Phone,
    string? EventType,
    string? EventDate,
    decimal? Budget
);

public record UpdateLeadRequest(
    string? Name,
    string? Phone,
    string? EventType,
    string? EventDate,
    decimal? Budget,
    string? Stage,
    string? LastMessage
);

public record SendLeadMessageRequest(
    [Required] string Body,
    [Required] string Direction
);

public record LeadMessageResponse(
    string Id,
    string LeadId,
    string Body,
    string Direction,
    DateTime SentAt
);

public record LeadResponse(
    string Id,
    string? ClientId,
    string Name,
    string Phone,
    string? EventType,
    string? EventDate,
    decimal? Budget,
    string Stage,
    string? LastMessage,
    int UnreadCount,
    DateTime CreatedAt,
    DateTime? LastMessageAt,
    List<LeadMessageResponse> Messages
);
