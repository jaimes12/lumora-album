using DnsClient;

namespace lumora_api.Services;

public static class EmailValidator
{
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
        "mailforspam.com", "mt2015.com", "mt2014.com", "crazymailing.com",
        "discard.email", "spamfree.eu", "mailnull.com", "spambob.com",
        "jetable.fr.nf", "nospam.ze.tc", "notsharingmy.info", "hi2.in",
        "trashdevil.de", "trashdevil.com", "mailscrap.com", "spamhereplease.com",
        "myspamless.com", "mintemail.com", "spamcannibal.com", "spamday.com",
    };

    public static bool IsDisposable(string email)
    {
        var at = email.IndexOf('@');
        if (at < 0) return false;
        var domain = email[(at + 1)..].ToLowerInvariant();
        return DisposableDomains.Contains(domain);
    }

    public static async Task<bool> DomainHasMxAsync(string email, int timeoutMs = 5000)
    {
        try
        {
            var at = email.IndexOf('@');
            if (at < 0) return false;
            var domain = email[(at + 1)..];

            var options = new LookupClientOptions { Timeout = TimeSpan.FromMilliseconds(timeoutMs) };
            var lookup = new LookupClient(options);
            var result = await lookup.QueryAsync(domain, QueryType.MX);
            return result.Answers.MxRecords().Any();
        }
        catch
        {
            // DNS timeout or unreachable — allow through to not block legitimate signups
            return true;
        }
    }
}
