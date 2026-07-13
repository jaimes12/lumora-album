using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace lumora_api.Models;

[Table("trips")]
public class Trip
{
    [Key][Column("id")] public string Id { get; set; } = Guid.NewGuid().ToString();
    [Column("org_id")] public string OrgId { get; set; } = string.Empty;
    [Column("name")] public string Name { get; set; } = string.Empty;
    [Column("destination")] public string Destination { get; set; } = string.Empty;
    [Column("departure_date")] public DateTime DepartureDate { get; set; }
    [Column("return_date")] public DateTime ReturnDate { get; set; }
    [Column("price_per_person")] public decimal PricePerPerson { get; set; }
    [Column("seats_total")] public int SeatsTotal { get; set; }
    [Column("status")] public string Status { get; set; } = "borrador";
    [Column("notes")] public string? Notes { get; set; }
    [Column("is_public")] public bool IsPublic { get; set; } = false;
    [Column("description")] public string? Description { get; set; }
    [Column("post_title")] public string? PostTitle { get; set; }
    [Column("includes")] public string? Includes { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Column("created_by_id")] public string? CreatedById { get; set; }
    public Organization? Organization { get; set; }
    public ICollection<TripPassenger> Passengers { get; set; } = [];
    public ICollection<TripPhoto> Photos { get; set; } = [];
}
