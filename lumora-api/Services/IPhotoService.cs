using lumora_api.DTOs;

namespace lumora_api.Services;

public interface IPhotoService
{
    Task<PhotoResponse> UploadAsync(string albumId, IFormFile file, UploadPhotoRequest req);
    Task<IEnumerable<PhotoResponse>> GetByAlbumAsync(string albumId);
    Task<bool> DeleteAsync(string photoId, string albumId);
}
