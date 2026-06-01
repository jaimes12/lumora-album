using Amazon.S3;
using Amazon.S3.Model;

namespace lumora_api.Services;

public interface IR2Service
{
    /// <summary>Upload media bytes to Cloudflare R2 and return the public URL (or null on failure).</summary>
    Task<string?> UploadAsync(byte[] data, string contentType);
}

public class R2Service(IConfiguration config, ILogger<R2Service> log) : IR2Service
{
    // Cloudflare account ID (visible in R2 dashboard URL)
    private static readonly string AccountId  = GetCfg("CF_R2_ACCOUNT_ID", "R2:AccountId");
    private static readonly string AccessKey  = GetCfg("CF_R2_ACCESS_KEY",  "R2:AccessKey");
    private static readonly string SecretKey  = GetCfg("CF_R2_SECRET_KEY",  "R2:SecretKey");
    private const string BucketName  = "lumora";
    private const string PublicBase  = "https://pub-1c226af57c324c868ed7aa9e4ea4b122.r2.dev";

    // Ext derived from MIME type
    private static string Ext(string mime) => mime.Split('/')[1].Split(';')[0].Trim() switch {
        "jpeg" or "jpg"             => ".jpg",
        "png"                       => ".png",
        "webp"                      => ".webp",
        "ogg"                       => ".ogg",
        "mpeg"                      => ".mp3",
        "mp4" or "x-m4a"           => ".m4a",
        "aac"                       => ".aac",
        _                           => ".bin",
    };

    public async Task<string?> UploadAsync(byte[] data, string contentType)
    {
        if (string.IsNullOrWhiteSpace(AccountId) || string.IsNullOrWhiteSpace(AccessKey))
        {
            log.LogDebug("R2 credentials not configured — media skipped");
            return null;
        }

        try
        {
            using var s3 = new AmazonS3Client(AccessKey, SecretKey, new AmazonS3Config
            {
                ServiceURL   = $"https://{AccountId}.r2.cloudflarestorage.com",
                ForcePathStyle = true,
            });

            // Daily folder prefix makes R2 lifecycle rules easy to configure
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

    private static string GetCfg(string envVar, string configKey) =>
        Environment.GetEnvironmentVariable(envVar) ?? string.Empty;
}
