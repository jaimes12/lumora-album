using System.Net.Http;
using System.Security.Cryptography;
using System.Text;

namespace lumora_api.Services;

public interface IR2Service
{
    Task<string?> UploadAsync(byte[] data, string contentType);
    Task<(bool ok, string detail)> TestAsync();
}

/// <summary>
/// Uploads media to Cloudflare R2 using raw HTTP + AWS Signature V4.
/// The official AWSSDK.S3 uses chunked transfer encoding
/// (STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER) which R2 does not support.
/// </summary>
public class R2Service(IConfiguration config, IHttpClientFactory http, ILogger<R2Service> log) : IR2Service
{
    private string AccountId  => config["R2:AccountId"]  ?? Environment.GetEnvironmentVariable("CF_R2_ACCOUNT_ID")  ?? "";
    private string AccessKey  => config["R2:AccessKey"]  ?? Environment.GetEnvironmentVariable("CF_R2_ACCESS_KEY")  ?? "";
    private string SecretKey  => config["R2:SecretKey"]  ?? Environment.GetEnvironmentVariable("CF_R2_SECRET_KEY")  ?? "";
    private string PublicBase => config["R2:PublicUrl"]  ?? "https://pub-1c226af57c324c868ed7aa9e4ea4b122.r2.dev";
    private const string Bucket = "lumora";

    public async Task<string?> UploadAsync(byte[] data, string contentType)
    {
        if (string.IsNullOrWhiteSpace(AccessKey) || AccessKey.StartsWith("TU_"))
        {
            log.LogDebug("R2 keys not configured — media skipped");
            return null;
        }
        try
        {
            var mime = contentType.Split(';')[0].Trim();
            var key  = $"media/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid():N}{Ext(mime)}";
            await PutObjectAsync(data, key, mime);
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
            var key  = $"_test/{Guid.NewGuid():N}.txt";
            var data = "lumora-r2-test"u8.ToArray();
            await PutObjectAsync(data, key, "text/plain");
            return (true, $"Upload OK → {PublicBase}/{key}");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    // ── Core: raw HTTP PUT with AWS Signature V4 ─────────────────────────────
    private async Task PutObjectAsync(byte[] data, string key, string contentType)
    {
        var now       = DateTime.UtcNow;
        var dateStamp = now.ToString("yyyyMMdd");
        var amzDate   = now.ToString("yyyyMMddTHHmmssZ");
        var host      = $"{AccountId}.r2.cloudflarestorage.com";
        var path      = $"/{Bucket}/{Uri.EscapeDataString(key).Replace("%2F", "/")}";
        var endpoint  = $"https://{host}{path}";

        // Payload hash (required for SigV4, prevents chunked mode)
        var payloadHash = Hex(SHA256.HashData(data));

        // Canonical request
        var canonHeaders =
            $"content-type:{contentType}\n" +
            $"host:{host}\n" +
            $"x-amz-content-sha256:{payloadHash}\n" +
            $"x-amz-date:{amzDate}\n";
        const string signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

        var canonRequest = string.Join("\n",
            "PUT", path, "",
            canonHeaders, signedHeaders, payloadHash);

        // String to sign
        var scope    = $"{dateStamp}/auto/s3/aws4_request";
        var strToSign =
            $"AWS4-HMAC-SHA256\n{amzDate}\n{scope}\n" +
            Hex(SHA256.HashData(Encoding.UTF8.GetBytes(canonRequest)));

        // Signing key
        var sigKey = HmacSha256(
            HmacSha256(
                HmacSha256(
                    HmacSha256(Encoding.UTF8.GetBytes("AWS4" + SecretKey), dateStamp),
                    "auto"),   // Cloudflare R2 region
                "s3"),
            "aws4_request");

        var signature  = Hex(HmacSha256(sigKey, strToSign));
        var authHeader = $"AWS4-HMAC-SHA256 Credential={AccessKey}/{scope}," +
                         $"SignedHeaders={signedHeaders},Signature={signature}";

        // HTTP PUT
        var client  = http.CreateClient();
        using var req = new HttpRequestMessage(HttpMethod.Put, endpoint);
        req.Content = new ByteArrayContent(data);
        req.Content.Headers.TryAddWithoutValidation("Content-Type", contentType);
        req.Headers.TryAddWithoutValidation("Authorization",         authHeader);
        req.Headers.TryAddWithoutValidation("x-amz-content-sha256", payloadHash);
        req.Headers.TryAddWithoutValidation("x-amz-date",           amzDate);

        var res = await client.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync();
            throw new Exception($"R2 {(int)res.StatusCode}: {body}");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static string Hex(byte[] b) =>
        BitConverter.ToString(b).Replace("-", "").ToLower();

    private static byte[] HmacSha256(byte[] key, string data)
    {
        using var hmac = new HMACSHA256(key);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
    }

    private static string Ext(string mime) => mime switch
    {
        "image/jpeg"             => ".jpg",
        "image/png"              => ".png",
        "image/webp"             => ".webp",
        "image/gif"              => ".gif",
        "audio/ogg"              => ".ogg",
        "audio/mpeg"             => ".mp3",
        "audio/mp4" or "audio/x-m4a" => ".m4a",
        "audio/aac"              => ".aac",
        "video/mp4"              => ".mp4",
        _                        => ".bin",
    };
}
