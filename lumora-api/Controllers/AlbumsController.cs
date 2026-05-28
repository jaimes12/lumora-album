using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlbumsController(IAlbumService albums) : ControllerBase
{
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateAlbumRequest req)
    {
        var uid = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        var email = User.FindFirst("email")?.Value ?? string.Empty;

        if (uid is null) return Unauthorized();

        var album = await albums.CreateAsync(uid, email, req);
        return CreatedAtAction(nameof(GetById), new { id = album.Id }, album);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var album = await albums.GetByIdAsync(id);
        return album is null ? NotFound() : Ok(album);
    }

    [HttpGet("code/{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var album = await albums.GetByAccessCodeAsync(code);
        return album is null ? NotFound() : Ok(album);
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> GetMine()
    {
        var uid = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        if (uid is null) return Unauthorized();

        var list = await albums.GetByOwnerAsync(uid);
        return Ok(list);
    }

    [HttpPatch("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateAlbumRequest req)
    {
        var uid = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        if (uid is null) return Unauthorized();

        var updated = await albums.UpdateAsync(id, uid, req);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var uid = User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value;
        if (uid is null) return Unauthorized();

        var deleted = await albums.DeleteAsync(id, uid);
        return deleted ? NoContent() : NotFound();
    }
}
