using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using lumora_api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace lumora_api.Controllers;

[ApiController]
[Route("api/superadmin")]
public class SuperAdminController(LumoraDbContext db, IConfiguration config) : ControllerBase
{
    private bool IsSuperAdmin =>
        (User.FindFirst("role")?.Value ??
         User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value) == "superadmin";

    // ── Login ─────────────────────────────────────────────────────────────────
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] SuperAdminLoginRequest req)
    {
        var sa = await db.SuperAdmins.FirstOrDefaultAsync(s => s.Email == req.Email);
        if (sa is null || !VerifyPassword(req.Password, sa.PasswordHash))
            return Unauthorized(new { message = "Credenciales incorrectas" });

        var secret = config["Jwt:Secret"] ?? "lumora-dev-secret-key-change-in-production-32chars";
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim("user_id", sa.Id),
            new Claim("email",   sa.Email),
            new Claim("name",    "Super Admin"),
            new Claim("role",    "superadmin"),
        };
        var token = new JwtSecurityToken(
            issuer:   "lumora-api",
            audience: "lumora-web",
            claims:   claims,
            expires:  DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
    }

    private static bool VerifyPassword(string password, string stored)
    {
        var parts = stored.Split(':');
        if (parts.Length != 2) return false;
        try
        {
            var salt   = Convert.FromBase64String(parts[0]);
            var expect = Convert.FromBase64String(parts[1]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password), salt, 100000,
                HashAlgorithmName.SHA256, 32);
            return CryptographicOperations.FixedTimeEquals(actual, expect);
        }
        catch { return false; }
    }

    // ── Overview ──────────────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs     = await db.Organizations.ToListAsync();
        var users    = await db.Users.ToListAsync();
        var events   = await db.Events.ToListAsync();
        var clients  = await db.Clients.ToListAsync();
        var planSales = await db.PlanHistories.ToListAsync();

        var byPlan = orgs
            .GroupBy(o => o.Plan)
            .Select(g => new { plan = g.Key, label = PlanLabel(g.Key), count = g.Count() })
            .OrderBy(x => PlanOrder(x.plan))
            .ToList();

        var year = DateTime.UtcNow.Year;
        var monthLabels = new[] { "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic" };
        var orgsByMonthDict = orgs
            .Where(o => o.CreatedAt.Year == year)
            .GroupBy(o => o.CreatedAt.Month)
            .ToDictionary(g => g.Key, g => g.Count());
        var orgsByMonth = Enumerable.Range(1, 12)
            .Select(m => new { label = monthLabels[m - 1], value = orgsByMonthDict.GetValueOrDefault(m, 0) })
            .ToList();

        var recentOrgs = orgs
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new {
                o.Id, o.Name, o.Plan,
                label     = PlanLabel(o.Plan),
                createdAt = o.CreatedAt.ToString("dd/MM/yyyy"),
                userCount  = users.Count(u => u.OrgId == o.Id),
                eventCount = events.Count(e => e.OrgId == o.Id),
            })
            .ToList();

        return Ok(new {
            totalOrgs     = orgs.Count,
            totalUsers    = users.Count(u => u.Role == "admin"),
            totalWorkers  = users.Count(u => u.Role == "member"),
            totalEvents   = events.Count,
            totalClients  = clients.Count,
            totalRevenue  = planSales.Where(p => p.Amount > 0).Sum(p => p.Amount),
            paidCount     = planSales.Count(p => p.Amount > 0),
            byPlan,
            orgsByMonth,
            recentOrgs,
        });
    }

    // ── Orgs ──────────────────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("orgs")]
    public async Task<IActionResult> GetOrgs()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs    = await db.Organizations.OrderByDescending(o => o.CreatedAt).ToListAsync();
        var users   = await db.Users.ToListAsync();
        var events  = await db.Events.ToListAsync();
        var clients = await db.Clients.ToListAsync();

        var result = orgs.Select(o => new {
            o.Id, o.Name, o.Plan,
            planLabel  = PlanLabel(o.Plan),
            createdAt  = o.CreatedAt.ToString("dd/MM/yyyy"),
            userCount  = users.Count(u => u.OrgId == o.Id && u.Role == "admin"),
            workerCount = users.Count(u => u.OrgId == o.Id && u.Role == "member"),
            eventCount = events.Count(e => e.OrgId == o.Id),
            clientCount = clients.Count(c => c.OrgId == o.Id),
            o.Disabled,
        }).ToList();

        return Ok(result);
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (!IsSuperAdmin) return Forbid();

        var users = await db.Users
            .Include(u => u.Organization)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var result = users.Select(u => new {
            u.Id, u.Name, u.Email, u.Phone, u.Role,
            orgName   = u.Organization?.Name ?? "—",
            plan      = u.Organization?.Plan ?? "—",
            planLabel = PlanLabel(u.Organization?.Plan ?? ""),
            createdAt = u.CreatedAt.ToString("dd/MM/yyyy"),
        }).ToList();

        return Ok(result);
    }

    // ── Events ────────────────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("events")]
    public async Task<IActionResult> GetEvents()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs = await db.Organizations.ToDictionaryAsync(o => o.Id, o => o.Name);
        var events = await db.Events
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var result = events.Select(e => new {
            e.Id, e.Name, e.Type, e.Status, e.Budget,
            orgName   = orgs.GetValueOrDefault(e.OrgId, "—"),
            eventDate = e.EventDate.ToString("dd/MM/yyyy"),
            createdAt = e.CreatedAt.ToString("dd/MM/yyyy"),
        }).ToList();

        return Ok(result);
    }

    // ── Clients ───────────────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("clients")]
    public async Task<IActionResult> GetClients()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs = await db.Organizations.ToDictionaryAsync(o => o.Id, o => o.Name);
        var clients = await db.Clients
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var result = clients.Select(c => new {
            c.Id, c.Name, c.Email, c.Phone,
            orgName   = orgs.GetValueOrDefault(c.OrgId, "—"),
            createdAt = c.CreatedAt.ToString("dd/MM/yyyy"),
        }).ToList();

        return Ok(result);
    }

    // ── Ventas (plan revenue) ─────────────────────────────────────────────────
    [Authorize]
    [HttpGet("ventas")]
    public async Task<IActionResult> GetVentas()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs    = await db.Organizations.ToDictionaryAsync(o => o.Id, o => o.Name);
        var history = await db.PlanHistories.OrderByDescending(h => h.ActivatedAt).ToListAsync();

        var monthLabels = new[] { "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic" };
        var year = DateTime.UtcNow.Year;

        // Revenue per month (current year, only paid)
        var byMonthDict = history
            .Where(h => h.Amount > 0 && h.ActivatedAt.Year == year)
            .GroupBy(h => h.ActivatedAt.Month)
            .ToDictionary(g => g.Key, g => g.Sum(h => h.Amount));

        var byMonth = Enumerable.Range(1, 12)
            .Select(m => new { label = monthLabels[m - 1], value = byMonthDict.GetValueOrDefault(m, 0m) })
            .ToList();

        var rows = history.Select(h => new {
            h.Id, h.OrgId, h.PlanId, h.Method, h.PromoCode, h.Amount,
            orgName     = orgs.GetValueOrDefault(h.OrgId, "—"),
            planLabel   = PlanLabel(h.PlanId),
            activatedAt = h.ActivatedAt.ToString("yyyy-MM-dd"),
            month       = h.ActivatedAt.ToString("yyyy-MM"),
            isPaid      = h.Amount > 0,
        }).ToList();

        var totalRevenue    = history.Where(h => h.Amount > 0).Sum(h => h.Amount);
        var monthRevenue    = history.Where(h => h.Amount > 0 && h.ActivatedAt.Year == year && h.ActivatedAt.Month == DateTime.UtcNow.Month).Sum(h => h.Amount);
        var paidCount       = history.Count(h => h.Amount > 0);
        var freeCount       = history.Count(h => h.Amount == 0);

        return Ok(new { totalRevenue, monthRevenue, paidCount, freeCount, byMonth, rows });
    }

    // ── Plans list ────────────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans()
    {
        if (!IsSuperAdmin) return Forbid();

        var orgs    = await db.Organizations.OrderByDescending(o => o.CreatedAt).ToListAsync();
        var users   = await db.Users.ToListAsync();
        var history = await db.PlanHistories.ToListAsync();

        var result = orgs.Select(o => {
            var orgHistory = history
                .Where(h => h.OrgId == o.Id)
                .OrderByDescending(h => h.ActivatedAt)
                .Select(h => new {
                    h.PlanId, h.Method, h.PromoCode, h.Amount,
                    activatedAt = h.ActivatedAt.ToString("dd/MM/yyyy HH:mm"),
                    planLabel   = PlanLabel(h.PlanId),
                })
                .ToList();

            var last = orgHistory.FirstOrDefault();
            return new {
                o.Id, o.Name, o.Plan,
                planLabel             = PlanLabel(o.Plan),
                stripeSubscriptionId  = o.StripeSubscriptionId,
                stripeCustomerId      = o.StripeCustomerId,
                adminCount            = users.Count(u => u.OrgId == o.Id && u.Role == "admin"),
                lastActivatedAt       = last?.activatedAt ?? "—",
                lastMethod            = last?.Method ?? "—",
                totalPaid             = orgHistory.Sum(h => h.Amount),
                history               = orgHistory,
                createdAt             = o.CreatedAt.ToString("dd/MM/yyyy"),
                o.Disabled,
            };
        }).ToList();

        return Ok(result);
    }

    // ── Change org plan ───────────────────────────────────────────────────────
    [Authorize]
    [HttpPut("orgs/{orgId}/plan")]
    public async Task<IActionResult> ChangePlan(string orgId, [FromBody] ChangePlanRequest req)
    {
        if (!IsSuperAdmin) return Forbid();

        var org = await db.Organizations.FindAsync(orgId);
        if (org is null) return NotFound();

        var validPlans = new[] { "free", "solo", "negocio", "agencia" };
        if (!validPlans.Contains(req.Plan)) return BadRequest("Plan inválido");

        org.Plan = req.Plan;

        db.PlanHistories.Add(new lumora_api.Models.PlanHistory
        {
            Id          = Guid.NewGuid().ToString(),
            OrgId       = orgId,
            PlanId      = req.Plan,
            Method      = "superadmin",
            PromoCode   = null,
            Amount      = 0,
            ActivatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
        return Ok(new { plan = req.Plan, planLabel = PlanLabel(req.Plan) });
    }

    [Authorize]
    [HttpPatch("orgs/{orgId}/disable")]
    public async Task<IActionResult> ToggleDisableOrg(string orgId)
    {
        if (!IsSuperAdmin) return Forbid();
        var org = await db.Organizations.FindAsync(orgId);
        if (org is null) return NotFound();
        org.Disabled = !org.Disabled;
        await db.SaveChangesAsync();
        return Ok(new { disabled = org.Disabled });
    }

    [Authorize]
    [HttpDelete("orgs/{orgId}")]
    public async Task<IActionResult> DeleteOrg(string orgId)
    {
        if (!IsSuperAdmin) return Forbid();
        var org = await db.Organizations.FindAsync(orgId);
        if (org is null) return NotFound();
        var users = db.Users.Where(u => u.OrgId == orgId);
        db.Users.RemoveRange(users);
        db.Organizations.Remove(org);
        await db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    // ── Promo codes CRUD ──────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("promo-codes")]
    public async Task<IActionResult> GetPromoCodes()
    {
        if (!IsSuperAdmin) return Forbid();
        var codes = await db.PromoCodes.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(codes.Select(p => new {
            p.Id, p.Code, p.PlanId, p.Description,
            planLabel   = PlanLabel(p.PlanId),
            p.DiscountPct,
            p.MaxUses, p.UsedCount, p.Active,
            expiresAt   = p.ExpiresAt?.ToString("yyyy-MM-dd"),
            createdAt   = p.CreatedAt.ToString("dd/MM/yyyy"),
            exhausted   = p.MaxUses >= 0 && p.UsedCount >= p.MaxUses,
        }));
    }

    [Authorize]
    [HttpPost("promo-codes")]
    public async Task<IActionResult> CreatePromoCode([FromBody] PromoCodeRequest req)
    {
        if (!IsSuperAdmin) return Forbid();

        var code = req.Code.Trim().ToUpperInvariant();
        if (await db.PromoCodes.AnyAsync(p => p.Code == code))
            return Conflict(new { message = "El código ya existe" });

        var promo = new lumora_api.Models.PromoCode
        {
            Id          = Guid.NewGuid().ToString(),
            Code        = code,
            PlanId      = req.PlanId,
            Description = req.Description,
            DiscountPct = req.DiscountPct,
            MaxUses     = req.MaxUses,
            ExpiresAt   = req.ExpiresAt.HasValue ? DateTime.SpecifyKind(req.ExpiresAt.Value, DateTimeKind.Utc) : null,
            Active      = true,
            CreatedAt   = DateTime.UtcNow,
        };
        db.PromoCodes.Add(promo);
        await db.SaveChangesAsync();
        return Ok(new { promo.Id, promo.Code, promo.PlanId, planLabel = PlanLabel(promo.PlanId), promo.DiscountPct, promo.MaxUses, promo.UsedCount, promo.Active, expiresAt = promo.ExpiresAt?.ToString("yyyy-MM-dd"), createdAt = promo.CreatedAt.ToString("dd/MM/yyyy"), exhausted = false });
    }

    [Authorize]
    [HttpPut("promo-codes/{id}")]
    public async Task<IActionResult> UpdatePromoCode(string id, [FromBody] PromoCodeRequest req)
    {
        if (!IsSuperAdmin) return Forbid();
        var promo = await db.PromoCodes.FindAsync(id);
        if (promo is null) return NotFound();

        promo.PlanId      = req.PlanId;
        promo.Description = req.Description;
        promo.DiscountPct = req.DiscountPct;
        promo.MaxUses     = req.MaxUses;
        promo.ExpiresAt   = req.ExpiresAt.HasValue ? DateTime.SpecifyKind(req.ExpiresAt.Value, DateTimeKind.Utc) : null;
        await db.SaveChangesAsync();
        return Ok(new { promo.Id, promo.Code, promo.PlanId, planLabel = PlanLabel(promo.PlanId), promo.DiscountPct, promo.MaxUses, promo.UsedCount, promo.Active, expiresAt = promo.ExpiresAt?.ToString("yyyy-MM-dd"), createdAt = promo.CreatedAt.ToString("dd/MM/yyyy"), exhausted = promo.MaxUses >= 0 && promo.UsedCount >= promo.MaxUses });
    }

    [Authorize]
    [HttpPatch("promo-codes/{id}/toggle")]
    public async Task<IActionResult> TogglePromoCode(string id)
    {
        if (!IsSuperAdmin) return Forbid();
        var promo = await db.PromoCodes.FindAsync(id);
        if (promo is null) return NotFound();
        promo.Active = !promo.Active;
        await db.SaveChangesAsync();
        return Ok(new { promo.Id, promo.Active });
    }

    [Authorize]
    [HttpDelete("promo-codes/{id}")]
    public async Task<IActionResult> DeletePromoCode(string id)
    {
        if (!IsSuperAdmin) return Forbid();
        var promo = await db.PromoCodes.FindAsync(id);
        if (promo is null) return NotFound();
        db.PromoCodes.Remove(promo);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Plan Configs ──────────────────────────────────────────────────────────

    [Authorize]
    [HttpGet("plan-configs")]
    public async Task<IActionResult> GetPlanConfigs()
    {
        if (!IsSuperAdmin) return Forbid();
        var plans = await db.PlanConfigs.OrderBy(p => p.SortOrder).ToListAsync();
        return Ok(plans.Select(p => new {
            p.Id, p.PlanId, p.Name, p.Price, p.Description, p.Color, p.Popular,
            features = System.Text.Json.JsonSerializer.Deserialize<object>(p.FeaturesJson),
            p.SortOrder, updatedAt = p.UpdatedAt.ToString("yyyy-MM-dd HH:mm")
        }));
    }

    [Authorize]
    [HttpPut("plan-configs/{planId}")]
    public async Task<IActionResult> UpdatePlanConfig(string planId, [FromBody] PlanConfigRequest req)
    {
        if (!IsSuperAdmin) return Forbid();
        var plan = await db.PlanConfigs.FirstOrDefaultAsync(p => p.PlanId == planId);

        if (plan is null)
        {
            plan = new lumora_api.Models.PlanConfig
            {
                Id          = $"plan_{planId}",
                PlanId      = planId,
                Name        = char.ToUpper(planId[0]) + planId[1..],
                SortOrder   = planId == "solo" ? 1 : planId == "negocio" ? 2 : 3,
            };
            db.PlanConfigs.Add(plan);
        }

        plan.Price        = req.Price;
        plan.Description  = req.Description ?? plan.Description;
        plan.Color        = req.Color ?? plan.Color;
        plan.Popular      = req.Popular;
        plan.FeaturesJson = JsonSerializer.Serialize(req.Features, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        plan.UpdatedAt    = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new {
            plan.Id, plan.PlanId, plan.Name, plan.Price, plan.Description, plan.Color, plan.Popular,
            features = System.Text.Json.JsonSerializer.Deserialize<object>(plan.FeaturesJson),
            updatedAt = plan.UpdatedAt.ToString("yyyy-MM-dd HH:mm")
        });
    }

    // ── Support Tickets ───────────────────────────────────────────────────────
    private static object TicketRow(lumora_api.Models.SupportTicket t) => new {
        t.Id, t.OrgId, t.OrgName, t.UserName, t.UserEmail,
        t.Type, t.Message, t.PhotoUrl, t.Status,
        createdAt = t.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
    };

    [Authorize]
    [HttpGet("support")]
    public async Task<IActionResult> GetSupportTickets()
    {
        if (!IsSuperAdmin) return Forbid();

        var tickets = await db.SupportTickets
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var ids = tickets.Select(t => t.Id).ToList();
        var msgCounts = await db.SupportMessages
            .Where(m => ids.Contains(m.TicketId))
            .GroupBy(m => m.TicketId)
            .Select(g => new { TicketId = g.Key, Count = g.Count() })
            .ToListAsync();
        var countMap = msgCounts.ToDictionary(x => x.TicketId, x => x.Count);

        return Ok(tickets.Select(t => new {
            t.Id, t.OrgId, t.OrgName, t.UserName, t.UserEmail,
            t.Type, t.Message, t.PhotoUrl, t.Status,
            createdAt  = t.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            replyCount = countMap.GetValueOrDefault(t.Id, 0),
        }));
    }

    [Authorize]
    [HttpGet("support/{id}")]
    public async Task<IActionResult> GetSupportTicket(string id)
    {
        if (!IsSuperAdmin) return Forbid();

        var ticket = await db.SupportTickets.FindAsync(id);
        if (ticket is null) return NotFound();

        var messages = await db.SupportMessages
            .Where(m => m.TicketId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return Ok(new {
            ticket.Id, ticket.OrgId, ticket.OrgName, ticket.UserName, ticket.UserEmail,
            ticket.Type, ticket.Message, ticket.PhotoUrl, ticket.Status,
            createdAt = ticket.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            messages  = messages.Select(m => new {
                m.Id, m.AuthorRole, m.AuthorName, m.Message,
                createdAt = m.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            }).ToList(),
        });
    }

    [Authorize]
    [HttpPost("support/{id}/messages")]
    public async Task<IActionResult> ReplyToTicket(string id, [FromBody] AdminReplyRequest req)
    {
        if (!IsSuperAdmin) return Forbid();

        var ticket = await db.SupportTickets.FindAsync(id);
        if (ticket is null) return NotFound();

        var msg = new lumora_api.Models.SupportMessage
        {
            Id         = Guid.NewGuid().ToString(),
            TicketId   = id,
            AuthorRole = "admin",
            AuthorName = "Soporte Elixe",
            Message    = req.Message,
            CreatedAt  = DateTime.UtcNow,
        };

        // When admin replies, set to in_progress if still open
        if (ticket.Status == "open") ticket.Status = "en_proceso";

        db.SupportMessages.Add(msg);
        await db.SaveChangesAsync();

        return Ok(new { msg.Id, msg.AuthorRole, msg.AuthorName, msg.Message,
            createdAt = msg.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            ticketStatus = ticket.Status });
    }

    [Authorize]
    [HttpPatch("support/{id}/status")]
    public async Task<IActionResult> UpdateSupportStatus(string id, [FromBody] UpdateSupportStatusRequest req)
    {
        if (!IsSuperAdmin) return Forbid();

        var ticket = await db.SupportTickets.FindAsync(id);
        if (ticket is null) return NotFound();

        var valid = new[] { "open", "en_proceso", "closed" };
        ticket.Status = valid.Contains(req.Status) ? req.Status : "open";
        await db.SaveChangesAsync();
        return Ok(new { ticket.Id, ticket.Status });
    }

    [Authorize]
    [HttpDelete("support/{id}")]
    public async Task<IActionResult> DeleteSupportTicket(string id)
    {
        if (!IsSuperAdmin) return Forbid();

        var ticket = await db.SupportTickets.FindAsync(id);
        if (ticket is null) return NotFound();

        var messages = await db.SupportMessages.Where(m => m.TicketId == id).ToListAsync();
        db.SupportMessages.RemoveRange(messages);
        db.SupportTickets.Remove(ticket);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string PlanLabel(string plan) => plan switch {
        "solo"    => "Solo",
        "negocio" => "Negocio",
        "agencia" => "Agencia",
        _         => "Sin plan",
    };

    private static int PlanOrder(string plan) => plan switch {
        "agencia" => 0, "negocio" => 1, "solo" => 2, _ => 3,
    };
}

public record SuperAdminLoginRequest(string Email, string Password);
public record UpdateSupportStatusRequest(string Status);
public record AdminReplyRequest(string Message);
public record ChangePlanRequest(string Plan);
public record PlanConfigRequest(
    int Price,
    string? Description,
    string? Color,
    bool Popular,
    List<PlanFeatureItem> Features
);
public record PlanFeatureItem(string Text, bool Ok);
public record PromoCodeRequest(
    string Code,
    string PlanId,
    string? Description,
    int DiscountPct,
    int MaxUses,
    DateTime? ExpiresAt
);
