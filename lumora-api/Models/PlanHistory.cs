using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("org_plan_history")]
public class PlanHistory
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("plan_id")]
    public string PlanId { get; set; } = string.Empty;

    [Column("method")]
    public string Method { get; set; } = "stripe";

    [Column("promo_code")]
    public string? PromoCode { get; set; }

    [Column("amount")]
    public decimal Amount { get; set; } = 0;

    [Column("activated_at")]
    public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;
}
