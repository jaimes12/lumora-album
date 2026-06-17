using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("support_tickets")]
public class SupportTicket
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string? OrgId { get; set; }

    [Column("org_name")]
    public string OrgName { get; set; } = string.Empty;

    [Column("user_name")]
    public string UserName { get; set; } = string.Empty;

    [Column("user_email")]
    public string UserEmail { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = "duda"; // duda | problema

    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("photo_url")]
    public string? PhotoUrl { get; set; }

    [Column("status")]
    public string Status { get; set; } = "open"; // open | closed

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
