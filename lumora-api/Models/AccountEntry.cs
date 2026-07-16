using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace lumora_api.Models;

[Table("account_entries")]
public class AccountEntry
{
    [Key][Column("id")] public string Id { get; set; } = Guid.NewGuid().ToString();
    [Column("account_id")] public string AccountId { get; set; } = string.Empty;
    [Column("org_id")] public string OrgId { get; set; } = string.Empty;
    [Column("entry_date")] public DateTime EntryDate { get; set; } = DateTime.UtcNow;
    [Column("concept")] public string Concept { get; set; } = string.Empty;
    [Column("category")] public string? Category { get; set; }
    [Column("type")] public string Type { get; set; } = "gasto"; // ingreso | gasto
    [Column("amount")] public decimal Amount { get; set; }
    [Column("trip_id")] public string? TripId { get; set; }
    [Column("notes")] public string? Notes { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Account? Account { get; set; }
}
