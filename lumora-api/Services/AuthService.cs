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
}

public class AuthService(LumoraDbContext db, IConfiguration config) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (existing is not null)
            throw new InvalidOperationException("El correo ya está registrado.");

        var org = new Organization
        {
            Id = Guid.NewGuid().ToString(),
            Name = req.OrgName,
            Plan = "free",
            CreatedAt = DateTime.UtcNow
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
            GenerateToken(user),
            user.Id,
            user.OrgId,
            user.Name,
            user.Email
        );
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user is null || user.PasswordHash is null)
            return null;

        if (!VerifyPassword(req.Password, user.PasswordHash))
            return null;

        return new AuthResponse(
            GenerateToken(user),
            user.Id,
            user.OrgId,
            user.Name,
            user.Email
        );
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

    private string GenerateToken(User user)
    {
        var secret = config["Jwt:Secret"] ?? "lumora-dev-secret-key-change-in-production-32chars";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("user_id", user.Id),
            new Claim("org_id", user.OrgId),
            new Claim("email", user.Email),
            new Claim("name", user.Name)
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
