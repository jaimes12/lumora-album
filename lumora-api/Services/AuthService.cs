using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace lumora_api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req);
    Task<AuthResponse?> LoginAsync(LoginRequest req);
    Task<bool> EmailExistsAsync(string email);
    Task UpdatePlanAsync(string orgId, string plan);
    Task<UserProfileResponse> GetProfileAsync(string userId);
    Task UpdateProfileAsync(string userId, UpdateProfileRequest req);
    Task UpdateEmailAsync(string userId, UpdateEmailRequest req);
    Task UpdatePasswordAsync(string userId, UpdatePasswordRequest req);
    Task<string> UpdatePhotoAsync(string userId, string photoBase64, IR2Service r2);
    Task<DateTime> StartTrialAsync(string orgId);
}

public class AuthService(LumoraDbContext db, IConfiguration config, IR2Service r2) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        if (EmailValidator.IsDisposable(req.Email))
            throw new InvalidOperationException("Este correo no existe. Ingresa un correo real.");

        if (!await EmailValidator.DomainHasMxAsync(req.Email))
            throw new InvalidOperationException("Este correo no existe. Ingresa un correo real.");

        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (existing is not null)
            throw new InvalidOperationException("El correo ya está registrado.");

        var org = new Organization
        {
            Id = Guid.NewGuid().ToString(),
            Name = req.OrgName,
            Plan = "free",
            Industry = req.Industry ?? "events",
            CreatedAt = DateTime.UtcNow,
            TrialStartedAt = DateTime.UtcNow
        };
        await db.Organizations.AddAsync(org);

        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            OrgId = org.Id,
            Email = req.Email,
            Name = req.Name,
            Role = "admin",
            PasswordHash = HashPassword(req.Password),
            CreatedAt = DateTime.UtcNow
        };
        await db.Users.AddAsync(user);
        await db.SaveChangesAsync();

        return new AuthResponse(
            GenerateToken(user, org.Industry),
            user.Id,
            user.OrgId,
            user.Name,
            user.Email,
            "free",
            user.Role,
            org.TrialStartedAt,
            org.Industry
        );
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest req)
    {
        var user = await db.Users.Include(u => u.Organization).FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user is null || user.PasswordHash is null)
            return null;

        if (!VerifyPassword(req.Password, user.PasswordHash))
            return null;

        if (user.Organization?.Disabled == true)
            throw new InvalidOperationException("ACCOUNT_DISABLED");

        return new AuthResponse(
            GenerateToken(user, user.Organization?.Industry ?? "events"),
            user.Id,
            user.OrgId,
            user.Name,
            user.Email,
            user.Organization?.Plan ?? "free",
            user.Role,
            user.Organization?.TrialStartedAt,
            user.Organization?.Industry ?? "events"
        );
    }

    public async Task<bool> EmailExistsAsync(string email)
        => await db.Users.AnyAsync(u => u.Email == email);

    public async Task UpdatePlanAsync(string orgId, string plan)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        if (org is not null) { org.Plan = plan; await db.SaveChangesAsync(); }
    }

    public async Task<UserProfileResponse> GetProfileAsync(string userId)
    {
        var user = await db.Users.Include(u => u.Organization).FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new InvalidOperationException("Usuario no encontrado");
        return new UserProfileResponse(user.Id, user.Name, user.Email, user.ProfilePhoto, user.Organization?.Plan ?? "free", user.Role, user.Organization?.TrialStartedAt, user.Organization?.Industry ?? "events");
    }

    public async Task UpdateProfileAsync(string userId, UpdateProfileRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return;
        user.Name = req.Name.Trim();
        await db.SaveChangesAsync();
    }

    public async Task UpdateEmailAsync(string userId, UpdateEmailRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null || user.PasswordHash is null) throw new InvalidOperationException("Usuario no encontrado");
        if (!VerifyPassword(req.Password, user.PasswordHash)) throw new UnauthorizedAccessException("Contraseña incorrecta");
        var exists = await db.Users.AnyAsync(u => u.Email == req.NewEmail && u.Id != userId);
        if (exists) throw new InvalidOperationException("El correo ya está en uso");
        user.Email = req.NewEmail;
        await db.SaveChangesAsync();
    }

    public async Task UpdatePasswordAsync(string userId, UpdatePasswordRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null || user.PasswordHash is null) throw new InvalidOperationException("Usuario no encontrado");
        if (!VerifyPassword(req.OldPassword, user.PasswordHash)) throw new UnauthorizedAccessException("Contraseña actual incorrecta");
        user.PasswordHash = HashPassword(req.NewPassword);
        await db.SaveChangesAsync();
    }

    public async Task<string> UpdatePhotoAsync(string userId, string photoBase64, IR2Service r2)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new InvalidOperationException("Usuario no encontrado");
        var bytes = Convert.FromBase64String(photoBase64.Contains(',') ? photoBase64.Split(',')[1] : photoBase64);
        var url = await r2.UploadAsync(bytes, "image/jpeg");
        user.ProfilePhoto = url;
        await db.SaveChangesAsync();
        return url ?? string.Empty;
    }

    public async Task<DateTime> StartTrialAsync(string orgId)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId)
            ?? throw new InvalidOperationException("Organización no encontrada");
        if (org.TrialStartedAt.HasValue)
            return org.TrialStartedAt.Value;
        org.TrialStartedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return org.TrialStartedAt.Value;
    }

    private static string HashPassword(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            saltBytes,
            100000,
            HashAlgorithmName.SHA256,
            32
        );
        return $"{Convert.ToBase64String(saltBytes)}:{Convert.ToBase64String(hashBytes)}";
    }

    private static bool VerifyPassword(string password, string stored)
    {
        var parts = stored.Split(':');
        if (parts.Length != 2) return false;

        byte[] saltBytes;
        byte[] expectedHash;
        try
        {
            saltBytes = Convert.FromBase64String(parts[0]);
            expectedHash = Convert.FromBase64String(parts[1]);
        }
        catch
        {
            return false;
        }

        var actualHash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            saltBytes,
            100000,
            HashAlgorithmName.SHA256,
            32
        );
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }

    private string GenerateToken(User user, string industry = "events")
    {
        var secret = config["Jwt:Secret"] ?? "lumora-dev-secret-key-change-in-production-32chars";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("user_id", user.Id),
            new Claim("org_id", user.OrgId),
            new Claim("email", user.Email),
            new Claim("name", user.Name),
            new Claim("role", user.Role),
            new Claim("industry", industry)
        };

        var token = new JwtSecurityToken(
            issuer: "lumora-api",
            audience: "lumora-web",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
