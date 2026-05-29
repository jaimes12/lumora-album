using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("clients")]
public class Client
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("email")]
    public string? Email { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("company")]
    public string? Company { get; set; }

    [Column("stage")]
    public string Stage { get; set; } = "lead"; // lead|prospect|client|vip

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("tags", TypeName = "json")]
    public string Tags { get; set; } = "[]";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("last_contact_at")]
    public DateTime? LastContactAt { get; set; }

    public Organization? Organization { get; set; }
    public ICollection<Event> Events { get; set; } = [];
}
