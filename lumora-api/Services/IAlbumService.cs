using lumora_api.DTOs;

namespace lumora_api.Services;

public interface IAlbumService
{
    Task<AlbumResponse> CreateAsync(string ownerId, string ownerEmail, CreateAlbumRequest req);
    Task<AlbumResponse?> GetByIdAsync(string albumId);
    Task<AlbumResponse?> GetByAccessCodeAsync(string code);
    Task<IEnumerable<AlbumSummary>> GetByOwnerAsync(string ownerId);
    Task<AlbumResponse?> UpdateAsync(string albumId, string ownerId, UpdateAlbumRequest req);
    Task<bool> DeleteAsync(string albumId, string ownerId);
}
