using lumora_api.Data;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace lumora_api.Services;

public interface IStripeService
{
    Task<string> CreateCheckoutSessionAsync(string orgId, string planId, string successUrl, string cancelUrl);
    Task<string?> VerifyAndActivatePlanAsync(string sessionId, string orgId);
    Task HandleWebhookAsync(string payload, string signature);
    Task<(bool ok, string planId, string error)> ApplyPromoCodeAsync(string orgId, string code);
    string GetPublishableKey();
}

public class StripeService(IConfiguration config, LumoraDbContext db) : IStripeService
{
    private static readonly Dictionary<string, (string Name, long Centavos)> Plans = new()
    {
        ["solo"]    = ("Plan Solo",    39900),
        ["negocio"] = ("Plan Negocio", 79900),
        ["agencia"] = ("Plan Agencia", 149900),
    };

    public string GetPublishableKey() => config["Stripe:PublishableKey"] ?? "";

    public async Task<string> CreateCheckoutSessionAsync(string orgId, string planId, string successUrl, string cancelUrl)
    {
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

        if (!Plans.TryGetValue(planId, out var plan))
            throw new ArgumentException($"Plan inválido: {planId}");

        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            LineItems =
            [
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "mxn",
                        UnitAmount = plan.Centavos,
                        Recurring = new SessionLineItemPriceDataRecurringOptions { Interval = "month" },
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"{plan.Name} — Elixe",
                            Description = $"Suscripción mensual al {plan.Name} de Elixe",
                        },
                    },
                    Quantity = 1,
                }
            ],
            SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl  = cancelUrl,
            Metadata   = new Dictionary<string, string> { ["org_id"] = orgId, ["plan_id"] = planId },
            AllowPromotionCodes = true,
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);
        return session.Url;
    }

    public async Task<string?> VerifyAndActivatePlanAsync(string sessionId, string orgId)
    {
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];

        var service = new SessionService();
        var session = await service.GetAsync(sessionId);

        if (session.PaymentStatus != "paid" && session.Status != "complete")
            return null;

        var planId = session.Metadata.TryGetValue("plan_id", out var p) ? p : null;
        if (planId is null) return null;

        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        if (org is null) return null;

        org.Plan = planId;
        await db.SaveChangesAsync();
        return planId;
    }

    public async Task HandleWebhookAsync(string payload, string signature)
    {
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
        var webhookSecret = config["Stripe:WebhookSecret"];

        Event stripeEvent;
        if (!string.IsNullOrEmpty(webhookSecret))
        {
            stripeEvent = EventUtility.ConstructEvent(payload, signature, webhookSecret);
        }
        else
        {
            stripeEvent = EventUtility.ParseEvent(payload);
        }

        if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
        {
            var session = stripeEvent.Data.Object as Session;
            if (session?.Metadata.TryGetValue("org_id", out var orgId) == true &&
                session.Metadata.TryGetValue("plan_id", out var planId) == true)
            {
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
                if (org is not null)
                {
                    org.Plan = planId;
                    await db.SaveChangesAsync();
                }
            }
        }
        else if (stripeEvent.Type == EventTypes.CustomerSubscriptionDeleted)
        {
            var sub = stripeEvent.Data.Object as Subscription;
            if (sub?.Metadata.TryGetValue("org_id", out var orgId) == true)
            {
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
                if (org is not null) { org.Plan = "free"; await db.SaveChangesAsync(); }
            }
        }
    }

    public async Task<(bool ok, string planId, string error)> ApplyPromoCodeAsync(string orgId, string code)
    {
        var promo = await db.PromoCodes
            .FirstOrDefaultAsync(p => p.Code.ToUpper() == code.ToUpper() && p.Active);

        if (promo is null)
            return (false, "", "Código inválido o expirado");

        if (promo.ExpiresAt.HasValue && promo.ExpiresAt < DateTime.UtcNow)
            return (false, "", "Este código ha expirado");

        if (promo.MaxUses >= 0 && promo.UsedCount >= promo.MaxUses)
            return (false, "", "Este código ya alcanzó el límite de usos");

        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        if (org is null) return (false, "", "Organización no encontrada");

        org.Plan = promo.PlanId;
        promo.UsedCount++;
        await db.SaveChangesAsync();

        return (true, promo.PlanId, "");
    }
}
