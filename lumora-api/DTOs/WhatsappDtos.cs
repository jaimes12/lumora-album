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

// Payload POSTed by the WA server when an inbound message arrives
public record WaWebhookPayload(
    string  ClientName, // e.g. "lm_ba22ec7e_6745_..."
    string  From,       // e.g. "521234567890@c.us" or resolved from @lid
    string  Body,
    long?   Timestamp,
    string? Pushname,   // WA display name of the sender (contact.pushname)
    string? Number      // clean phone digits from contact.number
);

// WA connection status returned to the frontend
public record WaConnectionStatus(
    string State,   // loading | qr | ready | disconnected
    string? QrCode, // base64 PNG data-URL when state == "qr"
    bool Connected  // shorthand: state == "ready"
);
