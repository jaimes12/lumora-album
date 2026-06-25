using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace lumora_api.Models;

[Table("trip_passengers")]
public class TripPassenger
{
    [Key][Column("id")] public string Id { get; set; } = Guid.NewGuid().ToString();
    [Column("trip_id")] public string TripId { get; set; } = string.Empty;
    [Column("org_id")] public string OrgId { get; set; } = string.Empty;
    [Column("client_id")] public string ClientId { get; set; } = string.Empty;
    [Column("seats")] public int Seats { get; set; } = 1;
    [Column("total_cost")] public decimal TotalCost { get; set; }
    [Column("status")] public string Status { get; set; } = "pendiente";
    [Column("notes")] public string? Notes { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Trip? Trip { get; set; }
    public ICollection<TripPayment> Payments { get; set; } = [];
}
