using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("organizations")]
public class Organization
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("plan")]
    public string Plan { get; set; } = "free";

    [Column("stripe_customer_id")]
    public string? StripeCustomerId { get; set; }

    [Column("stripe_subscription_id")]
    public string? StripeSubscriptionId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("trial_started_at")]
    public DateTime? TrialStartedAt { get; set; }

    [Column("disabled")]
    public bool Disabled { get; set; } = false;

    public ICollection<Client> Clients { get; set; } = [];
    public ICollection<Event> Events { get; set; } = [];
}
