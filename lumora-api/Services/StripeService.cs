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
    Task<List<PaymentRecord>> GetPaymentHistoryAsync(string orgId);
    Task<SubscriptionInfo?> GetSubscriptionInfoAsync(string orgId);
    string GetPublishableKey();
}

public record PaymentRecord(string Date, string Method, decimal Amount, string Status);
public record SubscriptionInfo(bool IsStripe, string? NextBillingDate, string? StartDate);

public class StripeService(IConfiguration config, LumoraDbContext db) : IStripeService
{
    private static readonly Dictionary<string, (string Name, long Centavos)> Plans = new()
    {
        ["solo"]    = ("Plan Solo",    39900),
        ["negocio"] = ("Plan Negocio", 79900),
        ["agencia"] = ("Plan Agencia", 149900),
    };

    public string GetPublishableKey() => config["Stripe:PublishableKey"] ?? "";

    private void Configure() =>
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"] ?? "";

    public async Task<string> CreateCheckoutSessionAsync(string orgId, string planId, string successUrl, string cancelUrl)
    {
        Configure();

        if (!Plans.TryGetValue(planId, out var plan))
            throw new ArgumentException($"Plan inválido: {planId}");

        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            LineItems = new List<SessionLineItemOptions>
            {
                new()
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency  = "mxn",
                        UnitAmount = plan.Centavos,
                        Recurring = new SessionLineItemPriceDataRecurringOptions { Interval = "month" },
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name        = $"{plan.Name} — Elixe",
                            Description = $"Suscripción mensual al {plan.Name} de Elixe",
                        },
                    },
                    Quantity = 1,
                }
            },
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
        Configure();

        var service = new SessionService();
        var session = await service.GetAsync(sessionId);

        if (session.PaymentStatus != "paid" && session.Status != "complete")
            return null;

        session.Metadata.TryGetValue("plan_id", out var planId);
        if (string.IsNullOrEmpty(planId)) return null;

        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        if (org is null) return null;

        org.Plan = planId;
        if (!string.IsNullOrEmpty(session.CustomerId))
            org.StripeCustomerId = session.CustomerId;
        if (!string.IsNullOrEmpty(session.SubscriptionId))
            org.StripeSubscriptionId = session.SubscriptionId;

        await db.SaveChangesAsync();
        return planId;
    }

    public async Task<List<PaymentRecord>> GetPaymentHistoryAsync(string orgId)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        if (org is null) return [];

        // Promo-only users: return local history records
        if (string.IsNullOrEmpty(org.StripeCustomerId))
        {
            var localHistory = await db.PlanHistories
                .Where(h => h.OrgId == orgId)
                .OrderByDescending(h => h.ActivatedAt)
                .ToListAsync();

            return localHistory.Select(h => new PaymentRecord(
                Date:   h.ActivatedAt.ToLocalTime().ToString("d MMM yyyy"),
                Method: h.Method == "promo" ? $"Código: {h.PromoCode}" : "Stripe",
                Amount: h.Amount,
                Status: "Activado"
            )).ToList();
        }

        // Stripe users: return real invoices from Stripe
        Configure();
        var invoiceService = new InvoiceService();
        var invoices = await invoiceService.ListAsync(new InvoiceListOptions
        {
            Customer = org.StripeCustomerId,
            Limit    = 24,
            Status   = "paid",
            Expand   = ["data.payment_intent.payment_method"],
        });

        return invoices.Data.Select(inv =>
        {
            var card   = inv.PaymentIntent?.PaymentMethod?.Card;
            var method = card is not null
                ? $"{Capitalize(card.Brand)} •••• {card.Last4}"
                : "Tarjeta";

            return new PaymentRecord(
                Date:   inv.Created.ToLocalTime().ToString("d MMM yyyy"),
                Method: method,
                Amount: inv.AmountPaid / 100m,
                Status: "Pagado"
            );
        }).ToList();
    }

    public async Task HandleWebhookAsync(string payload, string signature)
    {
        Configure();
        var webhookSecret = config["Stripe:WebhookSecret"] ?? "";

        Stripe.Event stripeEvent;
        if (!string.IsNullOrEmpty(webhookSecret))
            stripeEvent = EventUtility.ConstructEvent(payload, signature, webhookSecret);
        else
            stripeEvent = EventUtility.ParseEvent(payload);

        if (stripeEvent.Type == "checkout.session.completed")
        {
            if (stripeEvent.Data.Object is Session session &&
                session.Metadata.TryGetValue("org_id",  out var orgId)  &&
                session.Metadata.TryGetValue("plan_id", out var planId))
            {
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
                if (org is not null)
                {
                    org.Plan = planId;
                    if (!string.IsNullOrEmpty(session.CustomerId))
                        org.StripeCustomerId = session.CustomerId;
                    if (!string.IsNullOrEmpty(session.SubscriptionId))
                        org.StripeSubscriptionId = session.SubscriptionId;
                    await db.SaveChangesAsync();
                }
            }
        }
        else if (stripeEvent.Type == "customer.subscription.deleted")
        {
            if (stripeEvent.Data.Object is Subscription sub &&
                sub.Metadata.TryGetValue("org_id", out var orgId))
            {
                var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
                if (org is not null) { org.Plan = "free"; await db.SaveChangesAsync(); }
            }
        }
    }

    public async Task<SubscriptionInfo?> GetSubscriptionInfoAsync(string orgId)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        if (org is null) return null;

        if (string.IsNullOrEmpty(org.StripeSubscriptionId))
            return new SubscriptionInfo(IsStripe: false, NextBillingDate: null, StartDate: null);

        Configure();
        var subService = new SubscriptionService();
        var sub = await subService.GetAsync(org.StripeSubscriptionId);

        var nextBilling = sub.CurrentPeriodEnd.ToLocalTime().ToString("d MMM yyyy");
        var startDate   = sub.CurrentPeriodStart.ToLocalTime().ToString("d MMM yyyy");

        return new SubscriptionInfo(IsStripe: true, NextBillingDate: nextBilling, StartDate: startDate);
    }

    private static string Capitalize(string s) =>
        string.IsNullOrEmpty(s) ? s : char.ToUpper(s[0]) + s[1..];

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

        db.PlanHistories.Add(new PlanHistory
        {
            Id          = Guid.NewGuid().ToString(),
            OrgId       = orgId,
            PlanId      = promo.PlanId,
            Method      = "promo",
            PromoCode   = promo.Code,
            Amount      = 0,
            ActivatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();

        return (true, promo.PlanId, "");
    }
}
