using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record RegisterRequest(
    [Required, MinLength(2), MaxLength(100)] string OrgName,
    [Required, MinLength(2), MaxLength(100)] string Name,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string Token,
    string UserId,
    string OrgId,
    string Name,
    string Email
);
