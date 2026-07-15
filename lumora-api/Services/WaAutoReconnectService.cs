using lumora_api.Data;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public class WaAutoReconnectService(IServiceScopeFactory scopeFactory, ILogger<WaAutoReconnectService> log) : IHostedService
{
    public Task StartAsync(CancellationToken ct)
    {
        // Fire-and-forget: never block host startup (and the deploy healthcheck) on the
        // WA bridge being reachable — a crashed/slow lumora-wa must not take down the API.
        _ = Task.Run(() => RunAsync(ct), ct);
        return Task.CompletedTask;
    }

    private async Task RunAsync(CancellationToken ct)
    {
        // Short delay to let the rest of the app finish startup
        await Task.Delay(TimeSpan.FromSeconds(5), ct);

        try
        {
            using var scope = scopeFactory.CreateScope();
            var db       = scope.ServiceProvider.GetRequiredService<LumoraDbContext>();
            var waServer = scope.ServiceProvider.GetRequiredService<IWaServerService>();

            var orgIds = await db.Organizations
                .Where(o => o.WaConnected && !o.Disabled)
                .Select(o => o.Id)
                .ToListAsync(ct);

            log.LogInformation("WA auto-reconnect: {Count} org(s) to reconnect", orgIds.Count);

            foreach (var orgId in orgIds)
            {
                try
                {
                    await waServer.ConnectAsync(orgId);
                    log.LogInformation("WA auto-reconnect: sent connect for org {OrgId}", orgId);
                }
                catch (Exception ex)
                {
                    log.LogWarning(ex, "WA auto-reconnect failed for org {OrgId}", orgId);
                }
                await Task.Delay(500, ct); // stagger requests
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            log.LogError(ex, "WA auto-reconnect service error");
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
