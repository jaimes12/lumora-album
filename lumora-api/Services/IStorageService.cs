namespace lumora_api.Services;

public interface IStorageService
{
    Task<(string Url, string StoragePath)> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string albumId
    );

    Task DeleteAsync(string storagePath);
}
