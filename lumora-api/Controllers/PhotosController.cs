using lumora_api.DTOs;
using lumora_api.Services;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/albums/{albumId}/photos")]
public class PhotosController(IPhotoService photos, IAlbumService albums) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(string albumId)
    {
        var album = await albums.GetByIdAsync(albumId);
        if (album is null) return NotFound("Álbum no encontrado");

        var list = await photos.GetByAlbumAsync(albumId);
        return Ok(list);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(
        string albumId,
        [FromForm] UploadPhotoRequest req,
        IFormFile file)
    {
        var album = await albums.GetByIdAsync(albumId);
        if (album is null || !album.IsActive)
            return NotFound("Álbum no encontrado o inactivo");

        try
        {
            var photo = await photos.UploadAsync(albumId, file, req);
            return Created($"/api/albums/{albumId}/photos/{photo.Id}", photo);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{photoId}")]
    public async Task<IActionResult> Delete(string albumId, string photoId)
    {
        var deleted = await photos.DeleteAsync(photoId, albumId);
        return deleted ? NoContent() : NotFound();
    }
}
