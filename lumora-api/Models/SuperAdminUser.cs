using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("superadmins")]
public class SuperAdminUser
{
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("email")]
    public string Email { get; set; } = "";

    [Column("password_hash")]
    public string PasswordHash { get; set; } = "";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
