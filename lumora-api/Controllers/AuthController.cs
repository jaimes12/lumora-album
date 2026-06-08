using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService auth, IR2Service r2) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        try
        {
            var result = await auth.RegisterAsync(req);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al registrar", detail = ex.Message });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        try
        {
            var result = await auth.LoginAsync(req);
            return result is null ? Unauthorized(new { message = "Credenciales incorrectas" }) : Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al iniciar sesión", detail = ex.Message });
        }
    }

    [HttpPost("check-email")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckEmail([FromBody] CheckEmailRequest req)
    {
        var exists = await auth.EmailExistsAsync(req.Email);
        return Ok(new { exists });
    }

    [HttpPatch("plan")]
    [Authorize]
    public async Task<IActionResult> UpdatePlan([FromBody] UpdatePlanRequest req)
    {
        var orgId = User.FindFirst("org_id")?.Value;
        if (string.IsNullOrEmpty(orgId)) return Unauthorized();
        await auth.UpdatePlanAsync(orgId, req.Plan);
        return Ok(new { ok = true });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        try { return Ok(await auth.GetProfileAsync(userId)); }
        catch (Exception ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        var userId = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        await auth.UpdateProfileAsync(userId, req);
        return Ok(new { ok = true });
    }

    [HttpPatch("email")]
    [Authorize]
    public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailRequest req)
    {
        var userId = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        try { await auth.UpdateEmailAsync(userId, req); return Ok(new { ok = true }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPatch("password")]
    [Authorize]
    public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest req)
    {
        var userId = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        try { await auth.UpdatePasswordAsync(userId, req); return Ok(new { ok = true }); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
    }

    [HttpPatch("photo")]
    [Authorize]
    public async Task<IActionResult> UpdatePhoto([FromBody] UpdatePhotoRequest req)
    {
        var userId = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        try
        {
            var url = await auth.UpdatePhotoAsync(userId, req.PhotoData, r2);
            return Ok(new { url });
        }
        catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
    }
}
