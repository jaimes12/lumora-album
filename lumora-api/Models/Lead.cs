using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("leads")]
public class Lead
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("client_id")]
    public string? ClientId { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("phone")]
    public string Phone { get; set; } = string.Empty;

    [Column("event_type")]
    public string? EventType { get; set; }

    [Column("event_date")]
    public string? EventDate { get; set; }

    [Column("budget")]
    public decimal? Budget { get; set; }

    [Column("stage")]
    public string Stage { get; set; } = "nuevo"; // nuevo|contactado|cotizacion|negociando|confirmado

    [Column("last_message")]
    public string? LastMessage { get; set; }

    [Column("unread_count")]
    public int UnreadCount { get; set; } = 0;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("last_message_at")]
    public DateTime? LastMessageAt { get; set; }

    public ICollection<LeadMessage> Messages { get; set; } = [];
}

[Table("lead_messages")]
public class LeadMessage
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("lead_id")]
    public string LeadId { get; set; } = string.Empty;

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("body")]
    public string Body { get; set; } = string.Empty;

    [Column("direction")]
    public string Direction { get; set; } = "inbound"; // inbound|outbound

    [Column("media_url")]
    public string? MediaUrl { get; set; }

    [Column("media_type")]
    public string? MediaType { get; set; }

    [Column("sent_at")]
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public Lead? Lead { get; set; }
}
