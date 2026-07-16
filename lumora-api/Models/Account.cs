using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace lumora_api.Models;

[Table("accounts")]
public class Account
{
    [Key][Column("id")] public string Id { get; set; } = Guid.NewGuid().ToString();
    [Column("org_id")] public string OrgId { get; set; } = string.Empty;
    [Column("name")] public string Name { get; set; } = string.Empty;
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("created_by_id")] public string? CreatedById { get; set; }
    public ICollection<AccountEntry> Entries { get; set; } = [];
}
