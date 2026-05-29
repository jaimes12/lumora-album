using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record CreateVendorRequest(
    [Required, MinLength(2), MaxLength(100)] string Name,
    [Required] string Category,
    string? Email, string? Phone, string? Website, string? Notes
);

public record UpdateVendorRequest(
    string? Name, string? Category, string? Email,
    string? Phone, string? Website, string? Notes,
    double? Rating, bool? IsActive
);

public record VendorResponse(
    string Id, string Name, string Category,
    string? Email, string? Phone, string? Website,
    string? Notes, double Rating, bool IsActive, DateTime CreatedAt
);
