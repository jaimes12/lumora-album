using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("events")]
public class Event
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("client_id")]
    public string ClientId { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = string.Empty; // boda, xv, corporativo, etc.

    [Column("status")]
    public string Status { get; set; } = "lead"; // lead|confirmed|in_progress|done|cancelled

    [Column("venue")]
    public string? Venue { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("budget")]
    public decimal Budget { get; set; }

    [Column("guest_count")]
    public int GuestCount { get; set; }

    [Column("event_date")]
    public DateTime EventDate { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Client? Client { get; set; }
    public Organization? Organization { get; set; }
}
