using System.Text.Json;

namespace lumora_api.Services;

public static class EmailValidator
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(6) };

    private static readonly HashSet<string> DisposableDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "mailinator.com", "guerrillamail.com", "guerrillamail.info", "guerrillamail.biz",
        "guerrillamail.de", "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com",
        "grr.la", "sharklasers.com", "spam4.me", "trashmail.com", "trashmail.me",
        "trashmail.net", "trashmail.at", "trashmail.io", "trashmail.xyz", "trashmail.fr",
        "dispostable.com", "mailnull.com", "spamgourmet.com", "fakeinbox.com",
        "maildrop.cc", "spamfree24.org", "tempinbox.com", "discard.email",
        "spambox.us", "10minutemail.com", "10minutemail.net", "tempr.email",
        "throwam.com", "getairmail.com", "filzmail.com", "emailondeck.com",
        "getnada.com", "mohmal.com", "mailnesia.com", "yopmail.com",
        "temp-mail.org", "temp-mail.io", "throwaway.email", "spamgrap.com",
        "mailforspam.com", "crazymailing.com", "spamfree.eu", "spambob.com",
        "jetable.fr.nf", "nospam.ze.tc", "notsharingmy.info", "hi2.in",
        "trashdevil.de", "trashdevil.com", "mailscrap.com", "mintemail.com",
    };

    public static bool IsDisposable(string email)
    {
        var at = email.IndexOf('@');
        if (at < 0) return false;
        return DisposableDomains.Contains(email[(at + 1)..]);
    }

    // Uses Cloudflare DNS-over-HTTPS — works in any containerized environment (no UDP needed)
    public static async Task<bool> DomainHasMxAsync(string email)
    {
        try
        {
            var at = email.IndexOf('@');
            if (at < 0) return false;
            var domain = Uri.EscapeDataString(email[(at + 1)..].ToLowerInvariant());

            var req = new HttpRequestMessage(HttpMethod.Get,
                $"https://1.1.1.1/dns-query?name={domain}&type=MX");
            req.Headers.Add("Accept", "application/dns-json");

            var res = await Http.SendAsync(req);
            if (!res.IsSuccessStatusCode) return true; // DoH unreachable, don't block

            var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());

            // Status 3 = NXDOMAIN — domain doesn't exist
            if (doc.RootElement.TryGetProperty("Status", out var status) && status.GetInt32() == 3)
                return false;

            // NOERROR + Answer with type 15 (MX) = has mail server
            if (doc.RootElement.TryGetProperty("Answer", out var answer))
                return answer.EnumerateArray().Any(a =>
                    a.TryGetProperty("type", out var t) && t.GetInt32() == 15);

            // NOERROR but no Answer = domain registered, no MX records
            return false;
        }
        catch
        {
            return true; // Network error — don't block legitimate signups
        }
    }
}
