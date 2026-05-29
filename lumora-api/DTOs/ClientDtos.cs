using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record CreateClientRequest(
    [Required, MinLength(2), MaxLength(100)] string Name,
    string? Email, string? Phone, string? Company,
    string? Notes, List<string>? Tags
);

public record UpdateClientRequest(
    string? Name, string? Email, string? Phone,
    string? Company, string? Stage, string? Notes,
    List<string>? Tags
);

public record ClientResponse(
    string Id, string Name, string? Email, string? Phone,
    string? Company, string Stage, string? Notes,
    List<string> Tags, DateTime CreatedAt, DateTime? LastContactAt
);
