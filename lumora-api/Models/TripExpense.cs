using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace lumora_api.Models;

[Table("trip_expenses")]
public class TripExpense
{
    [Key][Column("id")] public string Id { get; set; } = Guid.NewGuid().ToString();
    [Column("trip_id")] public string TripId { get; set; } = string.Empty;
    [Column("org_id")] public string OrgId { get; set; } = string.Empty;
    [Column("concept")] public string Concept { get; set; } = string.Empty;
    [Column("amount")] public decimal Amount { get; set; }
    [Column("paid")] public bool Paid { get; set; }
    [Column("notes")] public string? Notes { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Trip? Trip { get; set; }
}
