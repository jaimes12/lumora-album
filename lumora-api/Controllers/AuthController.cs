using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService auth) : ControllerBase
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
}
