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

// Payload POSTed by the WA server for inbound and outbound messages
public record WaWebhookPayload(
    string  ClientName,     // e.g. "lm_ba22ec7e_6745_..."
    string  From,           // PHONE@c.us — recipient for outbound, sender for inbound
    string? Body,           // nullable — images/audio may have no caption
    long?   Timestamp,
    string? Pushname,
    string? Number,         // clean digits from @c.us form of From
    string? Direction,      // "inbound" | "outbound" (outbound = sent from user's phone)
    string? MediaData,      // base64 image/audio, max 5 MB
    string? MediaType,      // MIME type, e.g. "image/jpeg" or "audio/ogg; codecs=opus"
    string? MediaFilename
);

// WA connection status returned to the frontend
public record WaConnectionStatus(
    string State,   // loading | qr | ready | disconnected
    string? QrCode, // base64 PNG data-URL when state == "qr"
    bool Connected  // shorthand: state == "ready"
);
