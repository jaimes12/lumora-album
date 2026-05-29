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
    int? GuestCount, string? Notes
);

public record EventResponse(
    string Id, string Name, string Type, string Status,
    string ClientId, string? VenueId, string? Notes,
    decimal Budget, int GuestCount,
    DateTime EventDate, DateTime CreatedAt
);
