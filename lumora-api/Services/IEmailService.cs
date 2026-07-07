namespace lumora_api.Services;

public interface IEmailService
{
    Task<bool> SendAsync(string to, string toName, string subject, string htmlBody);
}
