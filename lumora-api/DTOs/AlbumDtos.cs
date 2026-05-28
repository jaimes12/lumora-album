using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record CreateAlbumRequest(
    [Required, MinLength(3), MaxLength(80)] string Name,
    [MaxLength(300)] string? Description,
    DateTime? EventDate
);

public record AlbumResponse(
    string Id,
    string Name,
    string? Description,
    string AccessCode,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? EventDate,
    int PhotoCount
);

public record AlbumSummary(
    string Id,
    string Name,
    string? Description,
    string AccessCode,
    DateTime CreatedAt,
    int PhotoCount
);

public record UpdateAlbumRequest(
    [MinLength(3), MaxLength(80)] string? Name,
    [MaxLength(300)] string? Description,
    DateTime? EventDate,
    bool? IsActive
);
