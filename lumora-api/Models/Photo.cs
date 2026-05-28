using Google.Cloud.Firestore;

namespace lumora_api.Models;

[FirestoreData]
public class Photo
{
    [FirestoreDocumentId]
    public string Id { get; set; } = string.Empty;

    [FirestoreProperty]
    public string AlbumId { get; set; } = string.Empty;

    [FirestoreProperty]
    public string Url { get; set; } = string.Empty;

    [FirestoreProperty]
    public string ThumbnailUrl { get; set; } = string.Empty;

    [FirestoreProperty]
    public string StoragePath { get; set; } = string.Empty;

    [FirestoreProperty]
    public string UploaderName { get; set; } = string.Empty;

    [FirestoreProperty]
    public string? Caption { get; set; }

    [FirestoreProperty]
    public long SizeBytes { get; set; }

    [FirestoreProperty]
    public string ContentType { get; set; } = string.Empty;

    [FirestoreProperty]
    public Timestamp UploadedAt { get; set; }
}
