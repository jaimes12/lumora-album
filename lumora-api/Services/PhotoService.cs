using Google.Cloud.Firestore;
using lumora_api.DTOs;
using lumora_api.Models;

namespace lumora_api.Services;

public class PhotoService(FirestoreDb db, IStorageService storage) : IPhotoService
{
    private readonly CollectionReference _photos = db.Collection("photos");

    private static readonly HashSet<string> AllowedTypes =
        ["image/jpeg", "image/png", "image/webp", "image/heic", "image/gif"];

    private const long MaxSizeBytes = 20 * 1024 * 1024; // 20 MB

    public async Task<PhotoResponse> UploadAsync(string albumId, IFormFile file, UploadPhotoRequest req)
    {
        if (!AllowedTypes.Contains(file.ContentType.ToLower()))
            throw new InvalidOperationException($"Tipo de archivo no permitido: {file.ContentType}");

        if (file.Length > MaxSizeBytes)
            throw new InvalidOperationException("El archivo supera el tamaño máximo de 20 MB");

        using var stream = file.OpenReadStream();
        var (url, storagePath) = await storage.UploadAsync(stream, file.FileName, file.ContentType, albumId);

        var photo = new Photo
        {
            AlbumId = albumId,
            Url = url,
            ThumbnailUrl = url,
            StoragePath = storagePath,
            UploaderName = req.UploaderName,
            Caption = req.Caption,
            SizeBytes = file.Length,
            ContentType = file.ContentType,
            UploadedAt = Timestamp.GetCurrentTimestamp()
        };

        var docRef = await _photos.AddAsync(photo);
        photo.Id = docRef.Id;

        return ToResponse(photo);
    }

    public async Task<IEnumerable<PhotoResponse>> GetByAlbumAsync(string albumId)
    {
        var snap = await _photos
            .WhereEqualTo("AlbumId", albumId)
            .OrderByDescending("UploadedAt")
            .GetSnapshotAsync();

        return snap.Documents.Select(d =>
        {
            var p = d.ConvertTo<Photo>();
            p.Id = d.Id;
            return ToResponse(p);
        });
    }

    public async Task<bool> DeleteAsync(string photoId, string albumId)
    {
        var doc = await _photos.Document(photoId).GetSnapshotAsync();
        if (!doc.Exists) return false;

        var photo = doc.ConvertTo<Photo>();
        if (photo.AlbumId != albumId) return false;

        await storage.DeleteAsync(photo.StoragePath);
        await _photos.Document(photoId).DeleteAsync();
        return true;
    }

    private static PhotoResponse ToResponse(Photo p) => new(
        p.Id,
        p.AlbumId,
        p.Url,
        p.ThumbnailUrl,
        p.UploaderName,
        p.Caption,
        p.SizeBytes,
        p.UploadedAt.ToDateTime()
    );
}
