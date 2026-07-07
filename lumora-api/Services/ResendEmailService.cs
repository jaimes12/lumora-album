using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace lumora_api.Services;

public class ResendEmailService(IHttpClientFactory http, IConfiguration config, ILogger<ResendEmailService> log) : IEmailService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<bool> SendAsync(string to, string toName, string subject, string htmlBody)
    {
        var apiKey = config["RESEND_API_KEY"];
        if (string.IsNullOrEmpty(apiKey))
        {
            log.LogWarning("RESEND_API_KEY not configured — skipping email to {To}", to);
            return false;
        }

        var from = config["EMAIL_FROM"] ?? "Elixe <noreply@elixe.mx>";

        var payload = new
        {
            from,
            to    = new[] { string.IsNullOrEmpty(toName) ? to : $"{toName} <{to}>" },
            subject,
            html  = htmlBody,
        };

        try
        {
            var client = http.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var content = new StringContent(JsonSerializer.Serialize(payload, JsonOpts), Encoding.UTF8, "application/json");
            var res = await client.PostAsync("https://api.resend.com/emails", content);

            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync();
                log.LogWarning("Resend error {Status} for {To}: {Body}", res.StatusCode, to, body);
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            log.LogError(ex, "Failed to send email to {To}", to);
            return false;
        }
    }
}
