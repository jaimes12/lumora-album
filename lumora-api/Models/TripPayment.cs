using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace lumora_api.Models;

[Table("trip_payments")]
public class TripPayment
{
    [Key][Column("id")] public string Id { get; set; } = Guid.NewGuid().ToString();
    [Column("trip_id")] public string TripId { get; set; } = string.Empty;
    [Column("passenger_id")] public string PassengerId { get; set; } = string.Empty;
    [Column("org_id")] public string OrgId { get; set; } = string.Empty;
    [Column("concept")] public string Concept { get; set; } = string.Empty;
    [Column("amount")] public decimal Amount { get; set; }
    [Column("method")] public string Method { get; set; } = "transfer";
    [Column("paid_at")] public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public TripPassenger? Passenger { get; set; }
}
