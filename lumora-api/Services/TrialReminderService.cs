using lumora_api.Data;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

// Runs once daily; sends trial reminder / expiry emails via Resend.
public class TrialReminderService(IServiceScopeFactory scopeFactory, ILogger<TrialReminderService> log) : BackgroundService
{
    private const int TrialDays = 3;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // Wait until the next 9:00 AM CST (UTC-6) before first run
        await WaitUntilNextRun(ct);

        while (!ct.IsCancellationRequested)
        {
            try { await RunAsync(ct); }
            catch (Exception ex) { log.LogError(ex, "TrialReminderService error"); }

            // Run again in 24 hours
            await Task.Delay(TimeSpan.FromHours(24), ct);
        }
    }

    private async Task RunAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db    = scope.ServiceProvider.GetRequiredService<LumoraDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;

        // Orgs with an active trial (started within last 30 days) and no paid plan
        var trialOrgs = await db.Organizations
            .Where(o => o.TrialStartedAt.HasValue && !o.Disabled &&
                        o.Plan == "free" &&
                        o.TrialStartedAt.Value > now.AddDays(-30))
            .ToListAsync(ct);

        foreach (var org in trialOrgs)
        {
            var elapsed = (now - org.TrialStartedAt!.Value).TotalDays;
            var daysLeft = TrialDays - (int)Math.Floor(elapsed);

            // Pick the right email type for this day
            string? emailType = daysLeft switch
            {
                2 => "day1",      // Day 1 of trial — 2 days left
                1 => "expiring",  // Day 2 — expires tomorrow
                0 => "expired",   // Day 3 — expires today / just expired
                -1 or -2 => "nudge", // 1-2 days post expiry
                _ => null,
            };
            if (emailType is null) continue;

            // Check we haven't already sent this type to this org
            var conn = db.Database.GetDbConnection();
            await conn.OpenAsync(ct);
            int count;
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "SELECT COUNT(*) FROM trial_email_log WHERE org_id = @orgId AND email_type = @type";
                var p1 = cmd.CreateParameter(); p1.ParameterName = "@orgId"; p1.Value = org.Id; cmd.Parameters.Add(p1);
                var p2 = cmd.CreateParameter(); p2.ParameterName = "@type";  p2.Value = emailType; cmd.Parameters.Add(p2);
                count = Convert.ToInt32(await cmd.ExecuteScalarAsync(ct));
            }

            if (count > 0) continue;

            // Get admin user email for this org
            var adminUser = await db.Users
                .Where(u => u.OrgId == org.Id && u.Role == "admin")
                .Select(u => new { u.Email, u.Name })
                .FirstOrDefaultAsync(ct);

            if (adminUser is null || string.IsNullOrEmpty(adminUser.Email)) continue;

            var (subject, html) = BuildEmail(emailType, adminUser.Name, org.Name, daysLeft);
            var sent = await email.SendAsync(adminUser.Email, adminUser.Name, subject, html);

            if (sent)
            {
                using var cmd2 = conn.CreateCommand();
                cmd2.CommandText = "INSERT IGNORE INTO trial_email_log (id, org_id, email_type, sent_at) VALUES (@id, @orgId, @type, NOW())";
                var a = cmd2.CreateParameter(); a.ParameterName = "@id";    a.Value = Guid.NewGuid().ToString(); cmd2.Parameters.Add(a);
                var b = cmd2.CreateParameter(); b.ParameterName = "@orgId"; b.Value = org.Id; cmd2.Parameters.Add(b);
                var c = cmd2.CreateParameter(); c.ParameterName = "@type";  c.Value = emailType; cmd2.Parameters.Add(c);
                await cmd2.ExecuteNonQueryAsync(ct);
                log.LogInformation("Trial email '{Type}' sent to {Email} (org {OrgId})", emailType, adminUser.Email, org.Id);
            }
        }
    }

    private static (string subject, string html) BuildEmail(string type, string name, string orgName, int daysLeft)
    {
        var firstName = (name ?? "").Split(' ')[0];
        if (string.IsNullOrEmpty(firstName)) firstName = "hola";

        return type switch
        {
            "day1" => (
                "2 días restantes en tu prueba de Elixe ⏳",
                $"""
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
                  <h2 style="margin:0 0 12px;font-size:22px">¡Hola, {firstName}!</h2>
                  <p style="color:#555;line-height:1.6">Tu prueba gratuita de <strong>Elixe</strong> tiene <strong>2 días restantes</strong>. Sigue organizando tus eventos sin parar.</p>
                  <p style="color:#555;line-height:1.6">Con un plan activo puedes:</p>
                  <ul style="color:#555;line-height:2">
                    <li>Eventos y clientes ilimitados</li>
                    <li>WhatsApp CRM y pipeline de ventas</li>
                    <li>Cotizaciones, contratos y firma digital</li>
                  </ul>
                  <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:8px">Ver planes →</a>
                  <p style="color:#999;font-size:12px;margin-top:32px">Elixe · elixe.mx</p>
                </div>
                """
            ),
            "expiring" => (
                "Tu prueba de Elixe vence mañana 🚨",
                $"""
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
                  <h2 style="margin:0 0 12px;font-size:22px">{firstName}, tu prueba vence mañana</h2>
                  <p style="color:#555;line-height:1.6">A partir de mañana tu cuenta de <strong>Elixe</strong> quedará bloqueada. No pierdas acceso a tus eventos, clientes y herramientas.</p>
                  <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#ef4444;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:8px">Elige tu plan ahora →</a>
                  <p style="color:#999;font-size:12px;margin-top:32px">Elixe · elixe.mx</p>
                </div>
                """
            ),
            "expired" => (
                "Tu prueba de Elixe ha terminado — reactiva tu cuenta",
                $"""
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
                  <h2 style="margin:0 0 12px;font-size:22px">{firstName}, tu prueba ha terminado</h2>
                  <p style="color:#555;line-height:1.6">Tu período de prueba gratuita de <strong>Elixe</strong> ha vencido. Elige un plan para seguir gestionando tus eventos sin interrupciones.</p>
                  <p style="color:#555;line-height:1.6">Tus datos siguen guardados — solo necesitas activar tu plan.</p>
                  <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:8px">Reactivar cuenta →</a>
                  <p style="color:#999;font-size:12px;margin-top:32px">Elixe · elixe.mx</p>
                </div>
                """
            ),
            _ => (
                "¿Sigues por aquí? Reactiva tu cuenta de Elixe",
                $"""
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
                  <h2 style="margin:0 0 12px;font-size:22px">¡{firstName}, todavía estás a tiempo!</h2>
                  <p style="color:#555;line-height:1.6">Tu prueba en <strong>Elixe</strong> venció hace unos días. Tus eventos y clientes siguen ahí esperándote.</p>
                  <p style="color:#555;line-height:1.6">Activa tu plan desde <strong>$399/mes</strong> y retoma el control de tu negocio.</p>
                  <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:8px">Ver planes →</a>
                  <p style="color:#999;font-size:12px;margin-top:32px">Elixe · elixe.mx</p>
                </div>
                """
            ),
        };
    }

    private static async Task WaitUntilNextRun(CancellationToken ct)
    {
        // Target: 09:00 CST = 15:00 UTC
        var now = DateTime.UtcNow;
        var next = now.Date.AddHours(15);
        if (now >= next) next = next.AddDays(1);
        var delay = next - now;
        if (delay > TimeSpan.Zero)
            await Task.Delay(delay, ct);
    }
}
