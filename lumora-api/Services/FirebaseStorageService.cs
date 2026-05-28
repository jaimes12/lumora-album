using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;

namespace lumora_api.Services;

public class FirebaseStorageService(IConfiguration config) : IStorageService
{
    private readonly StorageClient _storage = StorageClient.Create();
    private readonly string _bucket = config["Firebase:StorageBucket"]
        ?? throw new InvalidOperationException("Firebase:StorageBucket not configured");

    public async Task<(string Url, string StoragePath)> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string albumId)
    {
        var ext = Path.GetExtension(fileName);
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var storagePath = $"albums/{albumId}/{uniqueName}";

        var obj = await _storage.UploadObjectAsync(
            _bucket,
            storagePath,
            contentType,
            fileStream,
            new UploadObjectOptions { PredefinedAcl = PredefinedObjectAcl.PublicRead }
        );

        var url = $"https://storage.googleapis.com/{_bucket}/{storagePath}";
        return (url, storagePath);
    }

    public async Task DeleteAsync(string storagePath)
    {
        await _storage.DeleteObjectAsync(_bucket, storagePath);
    }
}
