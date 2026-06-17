using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("shared_notes")]
public class SharedNote
{
    [Key] [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("user_name")]
    public string UserName { get; set; } = string.Empty;

    [Column("user_photo")]
    public string? UserPhoto { get; set; }

    [Column("content", TypeName = "longtext")]
    public string Content { get; set; } = string.Empty;

    [Column("color")]
    public string Color { get; set; } = "yellow";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
