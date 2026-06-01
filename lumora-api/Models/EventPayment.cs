using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("event_payments")]
public class EventPayment
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("event_id")]
    public string EventId { get; set; } = string.Empty;

    [Column("concept")]
    public string Concept { get; set; } = string.Empty;

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("method")]
    public string Method { get; set; } = "transfer"; // transfer|cash|card|check

    [Column("paid_at")]
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Event? Event { get; set; }
}
