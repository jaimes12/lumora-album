using Google.Cloud.Firestore;
using lumora_api.DTOs;
using lumora_api.Models;

namespace lumora_api.Services;

public class AlbumService(FirestoreDb db) : IAlbumService
{
    private readonly CollectionReference _albums = db.Collection("albums");

    public async Task<AlbumResponse> CreateAsync(string ownerId, string ownerEmail, CreateAlbumRequest req)
    {
        var album = new Album
        {
            Name = req.Name,
            Description = req.Description ?? string.Empty,
            OwnerId = ownerId,
            OwnerEmail = ownerEmail,
            AccessCode = GenerateAccessCode(),
            IsActive = true,
            CreatedAt = Timestamp.GetCurrentTimestamp(),
            EventDate = req.EventDate.HasValue
                ? Timestamp.FromDateTime(req.EventDate.Value.ToUniversalTime())
                : null
        };

        var docRef = await _albums.AddAsync(album);
        album.Id = docRef.Id;

        return ToResponse(album, 0);
    }

    public async Task<AlbumResponse?> GetByIdAsync(string albumId)
    {
        var doc = await _albums.Document(albumId).GetSnapshotAsync();
        if (!doc.Exists) return null;

        var album = doc.ConvertTo<Album>();
        album.Id = doc.Id;
        var count = await GetPhotoCountAsync(albumId);
        return ToResponse(album, count);
    }

    public async Task<AlbumResponse?> GetByAccessCodeAsync(string code)
    {
        var query = await _albums
            .WhereEqualTo("AccessCode", code.ToUpperInvariant())
            .WhereEqualTo("IsActive", true)
            .Limit(1)
            .GetSnapshotAsync();

        if (!query.Documents.Any()) return null;

        var doc = query.Documents[0];
        var album = doc.ConvertTo<Album>();
        album.Id = doc.Id;
        var count = await GetPhotoCountAsync(doc.Id);
        return ToResponse(album, count);
    }

    public async Task<IEnumerable<AlbumSummary>> GetByOwnerAsync(string ownerId)
    {
        var query = await _albums
            .WhereEqualTo("OwnerId", ownerId)
            .OrderByDescending("CreatedAt")
            .GetSnapshotAsync();

        var results = new List<AlbumSummary>();
        foreach (var doc in query.Documents)
        {
            var album = doc.ConvertTo<Album>();
            album.Id = doc.Id;
            var count = await GetPhotoCountAsync(doc.Id);
            results.Add(new AlbumSummary(
                album.Id,
                album.Name,
                album.Description,
                album.AccessCode,
                album.CreatedAt.ToDateTime(),
                count
            ));
        }
        return results;
    }

    public async Task<AlbumResponse?> UpdateAsync(string albumId, string ownerId, UpdateAlbumRequest req)
    {
        var docRef = _albums.Document(albumId);
        var snapshot = await docRef.GetSnapshotAsync();

        if (!snapshot.Exists) return null;

        var album = snapshot.ConvertTo<Album>();
        if (album.OwnerId != ownerId) return null;

        var updates = new Dictionary<string, object>();
        if (req.Name is not null) updates["Name"] = req.Name;
        if (req.Description is not null) updates["Description"] = req.Description;
        if (req.IsActive.HasValue) updates["IsActive"] = req.IsActive.Value;
        if (req.EventDate.HasValue)
            updates["EventDate"] = Timestamp.FromDateTime(req.EventDate.Value.ToUniversalTime());

        if (updates.Count > 0)
            await docRef.UpdateAsync(updates);

        return await GetByIdAsync(albumId);
    }

    public async Task<bool> DeleteAsync(string albumId, string ownerId)
    {
        var doc = await _albums.Document(albumId).GetSnapshotAsync();
        if (!doc.Exists) return false;

        var album = doc.ConvertTo<Album>();
        if (album.OwnerId != ownerId) return false;

        await _albums.Document(albumId).DeleteAsync();
        return true;
    }

    private async Task<int> GetPhotoCountAsync(string albumId)
    {
        var snap = await db.Collection("photos")
            .WhereEqualTo("AlbumId", albumId)
            .GetSnapshotAsync();
        return snap.Count;
    }

    private static string GenerateAccessCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 8).Select(_ => chars[random.Next(chars.Length)]).ToArray());
    }

    private static AlbumResponse ToResponse(Album a, int photoCount) => new(
        a.Id,
        a.Name,
        a.Description,
        a.AccessCode,
        a.IsActive,
        a.CreatedAt.ToDateTime(),
        a.EventDate?.ToDateTime(),
        photoCount
    );
}
