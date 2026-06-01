using lumora_api.DTOs;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace lumora_api.Services;

public interface IWaServerService
{
    Task<WaConnectionStatus> GetStatusAsync(string orgId);
    Task ConnectAsync(string orgId);
    Task DisconnectAsync(string orgId);
    Task<bool> SendAsync(string orgId, string phone, string message, string? mediaUrl = null, string? mediaType = null);
}

public class WaServerService(IHttpClientFactory factory, ILogger<WaServerService> log) : IWaServerService
{
    // Prefix to avoid collisions with other projects using the same WA server
    private static string ClientName(string orgId) =>
        "lm_" + orgId.Replace('-', '_');

    private HttpClient Http => factory.CreateClient("wa");

    private static readonly JsonSerializerOptions Opts = new() { PropertyNameCaseInsensitive = true };

    public async Task<WaConnectionStatus> GetStatusAsync(string orgId)
    {
        try
        {
            var res = await Http.GetAsync("/api/whatsapp/status");
            if (!res.IsSuccessStatusCode) return new("disconnected", null, false);

            var json = await res.Content.ReadAsStringAsync();
            var payload = JsonSerializer.Deserialize<WaStatusPayload>(json, Opts);
            var name = ClientName(orgId);
            var client = payload?.Clients?.FirstOrDefault(c => c.Name == name);

            if (client is null) return new("disconnected", null, false);
            return new(client.State, client.QrCode, client.State == "ready");
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "WA server status check failed");
            return new("disconnected", null, false);
        }
    }

    public async Task ConnectAsync(string orgId)
    {
        try
        {
            var body = JsonSerializer.Serialize(new { name = ClientName(orgId) });
            await Http.PostAsync("/api/whatsapp/connect",
                new StringContent(body, Encoding.UTF8, "application/json"));
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "WA server connect failed for org {OrgId}", orgId);
        }
    }

    public async Task DisconnectAsync(string orgId)
    {
        try
        {
            var body = JsonSerializer.Serialize(new { name = ClientName(orgId) });
            await Http.PostAsync("/api/whatsapp/disconnect",
                new StringContent(body, Encoding.UTF8, "application/json"));
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "WA server disconnect failed for org {OrgId}", orgId);
        }
    }

    public async Task<bool> SendAsync(string orgId, string phone, string message, string? mediaUrl = null, string? mediaType = null)
    {
        try
        {
            object payload = mediaUrl is not null
                ? new { phone, message, clientName = ClientName(orgId), country = "mx", mediaUrl, mediaType }
                : new { phone, message, clientName = ClientName(orgId), country = "mx" };

            var body = JsonSerializer.Serialize(payload);
            var res  = await Http.PostAsync("/api/whatsapp/send",
                new StringContent(body, Encoding.UTF8, "application/json"));
            return res.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "WA send failed to {Phone} for org {OrgId}", phone, orgId);
            return false;
        }
    }

    // Internal deserialization types
    private record WaStatusPayload(List<WaClientEntry>? Clients);
    private record WaClientEntry(
        string Name,
        string State,
        [property: JsonPropertyName("qrCode")] string? QrCode
    );
}
