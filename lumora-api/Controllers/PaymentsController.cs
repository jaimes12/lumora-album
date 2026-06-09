using lumora_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController(IStripeService stripe) : ControllerBase
{
    private string OrgId => User.FindFirst("org_id")?.Value ?? User.FindFirst("user_id")?.Value ?? User.FindFirst("sub")?.Value ?? string.Empty;

    // Returns the publishable key so the frontend can init Stripe.js
    [HttpGet("config")]
    public IActionResult GetConfig() =>
        Ok(new { publishableKey = stripe.GetPublishableKey() });

    // Creates a Stripe Checkout session and returns the redirect URL
    [HttpPost("checkout")]
    [Authorize]
    public async Task<IActionResult> CreateCheckout([FromBody] CreateCheckoutRequest req)
    {
        try
        {
            var origin = Request.Headers.Origin.FirstOrDefault()
                ?? "https://lumora-web-production-c813.up.railway.app";

            var successUrl = $"{origin}/app/pago-exitoso";
            var cancelUrl  = $"{origin}/app/paquetes";

            var url = await stripe.CreateCheckoutSessionAsync(OrgId, req.PlanId, successUrl, cancelUrl);
            return Ok(new { url });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // Called after successful Stripe redirect — verifies session and activates plan
    [HttpPost("verify")]
    [Authorize]
    public async Task<IActionResult> VerifySession([FromBody] VerifySessionRequest req)
    {
        var planId = await stripe.VerifyAndActivatePlanAsync(req.SessionId, OrgId);
        if (planId is null)
            return BadRequest(new { error = "Sesión de pago no válida o incompleta" });
        return Ok(new { plan = planId });
    }

    // Applies a promo code and activates the associated plan for free
    [HttpPost("promo")]
    [Authorize]
    public async Task<IActionResult> ApplyPromo([FromBody] ApplyPromoRequest req)
    {
        var (ok, planId, error) = await stripe.ApplyPromoCodeAsync(OrgId, req.Code);
        if (!ok) return BadRequest(new { error });
        return Ok(new { plan = planId });
    }

    // Returns Stripe invoice history for the authenticated org
    [HttpGet("history")]
    [Authorize]
    public async Task<IActionResult> GetHistory()
    {
        var records = await stripe.GetPaymentHistoryAsync(OrgId);
        return Ok(records);
    }

    // Returns active subscription period info (next billing date, start date)
    [HttpGet("subscription")]
    [Authorize]
    public async Task<IActionResult> GetSubscription()
    {
        var info = await stripe.GetSubscriptionInfoAsync(OrgId);
        return Ok(info);
    }

    // Stripe webhook — receives payment events from Stripe servers
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var payload   = await new StreamReader(Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault() ?? "";
        try
        {
            await stripe.HandleWebhookAsync(payload, signature);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public record CreateCheckoutRequest(string PlanId);
public record VerifySessionRequest(string SessionId);
public record ApplyPromoRequest(string Code);
