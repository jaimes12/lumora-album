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
    string Email,
    string Plan,
    string Role
);

public record CheckEmailRequest([Required, EmailAddress] string Email);
public record UpdatePlanRequest([Required] string Plan);

public record UpdateProfileRequest([Required, MinLength(2), MaxLength(100)] string Name);
public record UpdateEmailRequest([Required, EmailAddress] string NewEmail, [Required] string Password);
public record UpdatePasswordRequest([Required] string OldPassword, [Required, MinLength(8)] string NewPassword);
public record UpdatePhotoRequest([Required] string PhotoData); // base64
public record UserProfileResponse(string UserId, string Name, string Email, string? PhotoUrl, string Plan, string Role);

public record CreateWorkerRequest(
    [Required, MinLength(2), MaxLength(100)] string Name,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    string? Phone
);

public record UpdateWorkerRequest(
    [Required, MinLength(2), MaxLength(100)] string Name,
    string? Phone,
    string? Password
);
