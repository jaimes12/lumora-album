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

    private static string WrapEmail(string body) => $"""
        <div style="background:#edeaf5;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
          <div style="max-width:560px;margin:0 auto">
            <!-- header -->
            <div style="background:linear-gradient(135deg,#5b4de0 0%,#7c6af7 60%,#a78bfa 100%);border-radius:14px 14px 0 0;padding:32px 36px;text-align:center">
              <img src="https://www.elixe.mx/minilogo_elixe.jpeg" alt="Elixe" width="56" height="56" style="border-radius:12px;display:block;margin:0 auto 10px" />
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">Software para organizadores de eventos</p>
            </div>
            <!-- body -->
            <div style="background:#ffffff;padding:40px 36px">{body}</div>
            <!-- footer -->
            <div style="background:#1e1b30;padding:24px 36px;border-radius:0 0 14px 14px;text-align:center">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px"><tr>
                <td style="text-align:right;padding-right:5px">
                  <a href="https://www.instagram.com/elixe_mx/" style="display:inline-block;background:#e1306c;color:#fff;border-radius:8px;padding:8px 16px;text-decoration:none;font-size:12px;font-weight:700">📷 Instagram</a>
                </td>
                <td style="text-align:left;padding-left:5px">
                  <a href="https://www.facebook.com/profile.php?id=61590859832846" style="display:inline-block;background:#1877f2;color:#fff;border-radius:8px;padding:8px 16px;text-decoration:none;font-size:12px;font-weight:700">📘 Facebook</a>
                </td>
              </tr></table>
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px">Elixe · Software para organizadores de eventos</p>
              <p style="margin:0;font-size:11px;color:#6b7280">
                <a href="https://www.elixe.mx" style="color:#6b7280;text-decoration:none">www.elixe.mx</a>
                &nbsp;·&nbsp;
                <a href="https://www.elixe.mx" style="color:#6b7280">Darse de baja</a>
              </p>
            </div>
          </div>
        </div>
        """;

    private static (string subject, string html) BuildEmail(string type, string name, string orgName, int daysLeft)
    {
        var firstName = (name ?? "").Split(' ')[0];
        if (string.IsNullOrEmpty(firstName)) firstName = "hola";

        return type switch
        {
            "day1" => (
                "2 días restantes en tu prueba de Elixe ⏳",
                WrapEmail($"""
                  <h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;font-weight:800">¡{firstName}, te quedan 2 días!</h2>
                  <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Cuenta de <strong>{orgName}</strong></p>
                  <p style="color:#4b5563;line-height:1.7;margin:0 0 16px">Tu prueba gratuita de <strong>Elixe</strong> termina en <strong>2 días</strong>. Aprovecha cada minuto para explorar todo lo que la plataforma tiene para ti.</p>

                  <div style="background:#f6f4ff;border-radius:12px;padding:22px 24px;margin:0 0 28px;border-left:4px solid #7c6af7">
                    <p style="margin:0 0 14px;font-size:12px;font-weight:800;color:#7c6af7;text-transform:uppercase;letter-spacing:0.06em">Con un plan activo tienes:</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Eventos y clientes ilimitados</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;WhatsApp CRM y pipeline de ventas</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Cotizaciones, contratos y firma digital</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Calendario, tareas y notas del equipo</p>
                    <p style="margin:0;color:#374151;font-size:14px">✅ &nbsp;Finanzas: ingresos, gastos y saldo</p>
                  </div>

                  <div style="background:#fff7ed;border-radius:10px;padding:16px 20px;margin:0 0 28px;text-align:center">
                    <p style="margin:0;color:#92400e;font-size:14px;font-weight:600">💡 Planes desde <strong>$399 / mes</strong> — sin contratos anuales</p>
                  </div>

                  <div style="text-align:center;margin:0 0 8px">
                    <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:15px 36px;border-radius:11px;text-decoration:none;font-weight:800;font-size:16px">Ver planes →</a>
                  </div>
                  <p style="text-align:center;color:#9ca3af;font-size:12px;margin:12px 0 0">Sin complicaciones. Cancela cuando quieras.</p>
                """)
            ),
            "expiring" => (
                "Tu prueba de Elixe vence mañana 🚨",
                WrapEmail($"""
                  <h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;font-weight:800">{firstName}, tu prueba vence mañana</h2>
                  <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Cuenta de <strong>{orgName}</strong></p>
                  <p style="color:#4b5563;line-height:1.7;margin:0 0 16px">A partir de mañana tu cuenta de <strong>Elixe</strong> quedará bloqueada. No pierdas acceso a tus eventos, clientes y herramientas que ya tienes configuradas.</p>

                  <div style="background:#fff1f2;border-radius:12px;padding:20px 24px;margin:0 0 24px;border-left:4px solid #ef4444;text-align:center">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#b91c1c">⏰ Te queda menos de 24 horas</p>
                  </div>

                  <div style="background:#f6f4ff;border-radius:12px;padding:20px 24px;margin:0 0 28px;border-left:4px solid #7c6af7">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:800;color:#7c6af7;text-transform:uppercase;letter-spacing:0.06em">Qué pierdes si no activas:</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">❌ &nbsp;Acceso a tus eventos y clientes</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">❌ &nbsp;WhatsApp CRM y conversaciones</p>
                    <p style="margin:0;color:#374151;font-size:14px">❌ &nbsp;Cotizaciones y contratos activos</p>
                  </div>

                  <div style="text-align:center;margin:0 0 8px">
                    <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#ef4444;color:#fff;padding:15px 36px;border-radius:11px;text-decoration:none;font-weight:800;font-size:16px">Elige tu plan ahora →</a>
                  </div>
                  <p style="text-align:center;color:#9ca3af;font-size:12px;margin:12px 0 0">Desde $399/mes. Sin contratos anuales.</p>
                """)
            ),
            "expired" => (
                "Tu prueba de Elixe ha terminado — reactiva tu cuenta",
                WrapEmail($"""
                  <h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;font-weight:800">{firstName}, tu prueba ha terminado</h2>
                  <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Cuenta de <strong>{orgName}</strong></p>
                  <p style="color:#4b5563;line-height:1.7;margin:0 0 16px">Tu período de prueba gratuita de <strong>Elixe</strong> ha vencido. Pero no te preocupes — todos tus eventos, clientes e información siguen guardados y listos para ti.</p>

                  <div style="background:#f6f4ff;border-radius:12px;padding:22px 24px;margin:0 0 24px;border-left:4px solid #7c6af7">
                    <p style="margin:0 0 14px;font-size:12px;font-weight:800;color:#7c6af7;text-transform:uppercase;letter-spacing:0.06em">Lo que tienes esperándote:</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">📅 &nbsp;Todos tus eventos y clientes</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">💬 &nbsp;Tu historial de WhatsApp CRM</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">📄 &nbsp;Cotizaciones y contratos creados</p>
                    <p style="margin:0;color:#374151;font-size:14px">💰 &nbsp;Tu registro de finanzas</p>
                  </div>

                  <div style="background:#fff7ed;border-radius:10px;padding:16px 20px;margin:0 0 28px;text-align:center">
                    <p style="margin:0;color:#92400e;font-size:14px;font-weight:600">💡 Planes desde <strong>$399 / mes</strong> — sin contratos anuales</p>
                  </div>

                  <div style="text-align:center;margin:0 0 8px">
                    <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:15px 36px;border-radius:11px;text-decoration:none;font-weight:800;font-size:16px">Reactivar mi cuenta →</a>
                  </div>
                  <p style="text-align:center;color:#9ca3af;font-size:12px;margin:12px 0 0">Tus datos te esperan. Un clic y sigues donde dejaste.</p>
                """)
            ),
            _ => (
                "¿Sigues por aquí? Reactiva tu cuenta de Elixe",
                WrapEmail($"""
                  <h2 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;font-weight:800">¡{firstName}, todavía estás a tiempo!</h2>
                  <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Cuenta de <strong>{orgName}</strong></p>
                  <p style="color:#4b5563;line-height:1.7;margin:0 0 16px">Tu prueba gratuita en <strong>Elixe</strong> venció hace unos días. Tus eventos y clientes siguen guardados y esperándote.</p>

                  <div style="background:#f6f4ff;border-radius:12px;padding:22px 24px;margin:0 0 24px;border-left:4px solid #7c6af7">
                    <p style="margin:0 0 14px;font-size:12px;font-weight:800;color:#7c6af7;text-transform:uppercase;letter-spacing:0.06em">Todo lo que Elixe tiene para ti:</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Gestión de eventos, clientes y pagos</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Cotizaciones y contratos con firma digital</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;WhatsApp CRM y pipeline de ventas</p>
                    <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Calendario, tareas y notas del equipo</p>
                    <p style="margin:0;color:#374151;font-size:14px">✅ &nbsp;Finanzas: ingresos, gastos y saldo en tiempo real</p>
                  </div>

                  <div style="background:#fff7ed;border-radius:10px;padding:16px 20px;margin:0 0 28px;text-align:center">
                    <p style="margin:0;color:#92400e;font-size:14px;font-weight:600">💡 Planes desde <strong>$399 / mes</strong> — sin contratos anuales</p>
                  </div>

                  <div style="text-align:center;margin:0 0 8px">
                    <a href="https://www.elixe.mx/app/paquetes" style="display:inline-block;background:#7c6af7;color:#fff;padding:15px 36px;border-radius:11px;text-decoration:none;font-weight:800;font-size:16px">Ver planes →</a>
                  </div>
                  <p style="text-align:center;color:#9ca3af;font-size:12px;margin:12px 0 0">Sin complicaciones. Cancela cuando quieras.</p>
                """)
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
