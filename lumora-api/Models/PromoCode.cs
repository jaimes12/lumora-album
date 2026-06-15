using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("promo_codes")]
public class PromoCode
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Column("plan_id")]
    public string PlanId { get; set; } = "negocio";

    [Column("description")]
    public string? Description { get; set; }

    [Column("max_uses")]
    public int MaxUses { get; set; } = -1; // -1 = unlimited

    [Column("used_count")]
    public int UsedCount { get; set; } = 0;

    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    [Column("discount_pct")]
    public int DiscountPct { get; set; } = 100; // 10, 20, 50, 100

    [Column("active")]
    public bool Active { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
