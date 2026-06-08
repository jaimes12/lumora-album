using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record CreateEventRequest(
    [Required, MinLength(2), MaxLength(100)] string Name,
    [Required] string Type,
    [Required] string ClientId,
    DateTime EventDate,
    decimal Budget,
    int GuestCount,
    string? VenueId,
    string? Notes
);

public record UpdateEventRequest(
    string? Name, string? Type, string? Status,
    string? ClientId, string? VenueId,
    DateTime? EventDate, decimal? Budget,
    int? GuestCount, string? Notes,
    DateTime? CreatedAt
);

public record CreatePaymentRequest(
    [Required] string Concept,
    [Required] decimal Amount,
    string Method = "transfer",
    DateTime? PaidAt = null
);

public record PaymentInfo(
    string Id, string Concept, decimal Amount,
    string Method, DateTime PaidAt
);

public record EventResponse(
    string Id, string Name, string Type, string Status,
    string ClientId, string? ClientName, string? ClientPhone,
    string? VenueId, string? Notes,
    decimal Budget, int GuestCount,
    DateTime EventDate, DateTime CreatedAt,
    List<PaymentInfo> Payments
);

public record AddEventPhotoRequest(
    [Required] string ImageData,   // base64
    string? Caption
);

public record EventPhotoResponse(
    string Id, string EventId, string Url,
    string? Caption, DateTime CreatedAt
);
