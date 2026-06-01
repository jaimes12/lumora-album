using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("contracts")]
public class Contract
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("client_id")]
    public string ClientId { get; set; } = string.Empty;

    [Column("event_id")]
    public string? EventId { get; set; }

    [Column("template")]
    public string Template { get; set; } = "general"; // boda|xv|corporativo|general

    [Column("status")]
    public string Status { get; set; } = "draft"; // draft|sent|signed|cancelled

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("total")]
    public decimal Total { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("sent_at")]
    public DateTime? SentAt { get; set; }

    [Column("signed_at")]
    public DateTime? SignedAt { get; set; }

    public Client? Client { get; set; }
    public Event? Event { get; set; }
}
