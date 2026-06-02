using Amazon.S3;
using Amazon.S3.Model;

namespace lumora_api.Services;

public interface IR2Service
{
    Task<string?> UploadAsync(byte[] data, string contentType);
    Task<(bool ok, string detail)> TestAsync();
}

public class R2Service(IConfiguration config, ILogger<R2Service> log) : IR2Service
{
    private string AccountId  => config["R2:AccountId"]  ?? Environment.GetEnvironmentVariable("CF_R2_ACCOUNT_ID")  ?? "";
    private string AccessKey  => config["R2:AccessKey"]  ?? Environment.GetEnvironmentVariable("CF_R2_ACCESS_KEY")  ?? "";
    private string SecretKey  => config["R2:SecretKey"]  ?? Environment.GetEnvironmentVariable("CF_R2_SECRET_KEY")  ?? "";
    private string PublicBase => config["R2:PublicUrl"]  ?? "https://pub-1c226af57c324c868ed7aa9e4ea4b122.r2.dev";
    private const string BucketName = "lumora";

    private static string Ext(string mime) => mime.Split('/')[1].Split(';')[0].Trim() switch {
        "jpeg" or "jpg" => ".jpg",
        "png"           => ".png",
        "webp"          => ".webp",
        "ogg"           => ".ogg",
        "mpeg"          => ".mp3",
        "mp4" or "x-m4a" => ".m4a",
        "aac"           => ".aac",
        _               => ".bin",
    };

    public async Task<string?> UploadAsync(byte[] data, string contentType)
    {
        if (string.IsNullOrWhiteSpace(AccessKey) || AccessKey.StartsWith("TU_"))
        {
            log.LogDebug("R2 keys not configured — media skipped");
            return null;
        }

        try
        {
            using var s3 = new AmazonS3Client(AccessKey, SecretKey, new AmazonS3Config
            {
                ServiceURL    = $"https://{AccountId}.r2.cloudflarestorage.com",
                ForcePathStyle = true,
            });

            // Daily folder makes Cloudflare lifecycle rules easy: delete media/ older than 30 days
            var key = $"media/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid():N}{Ext(contentType)}";

            using var ms = new MemoryStream(data);
            await s3.PutObjectAsync(new PutObjectRequest
            {
                BucketName  = BucketName,
                Key         = key,
                InputStream = ms,
                ContentType = contentType,
            });

            return $"{PublicBase}/{key}";
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "R2 upload failed");
            return null;
        }
    }

    public async Task<(bool ok, string detail)> TestAsync()
    {
        if (string.IsNullOrWhiteSpace(AccessKey) || AccessKey.StartsWith("TU_"))
            return (false, "R2 keys not configured");
        try
        {
            using var s3 = new AmazonS3Client(AccessKey, SecretKey, new AmazonS3Config
            {
                ServiceURL     = $"https://{AccountId}.r2.cloudflarestorage.com",
                ForcePathStyle = true,
            });
            // Upload a tiny test file
            var key = $"_test/{Guid.NewGuid():N}.txt";
            using var ms = new MemoryStream("ok"u8.ToArray());
            await s3.PutObjectAsync(new PutObjectRequest
            {
                BucketName  = BucketName,
                Key         = key,
                InputStream = ms,
                ContentType = "text/plain",
            });
            var url = $"{PublicBase}/{key}";
            return (true, $"Upload OK → {url}");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }
}
