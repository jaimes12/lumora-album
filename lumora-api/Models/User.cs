using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = string.Empty; // Firebase UID

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("role")]
    public string Role { get; set; } = "member";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("password_hash")]
    public string? PasswordHash { get; set; }

    public Organization? Organization { get; set; }
}
