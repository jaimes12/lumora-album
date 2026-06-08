using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("event_products")]
public class EventProduct
{
    [Key, Column("id")]             public string Id { get; set; } = Guid.NewGuid().ToString();
    [Column("event_id")]            public string EventId { get; set; } = string.Empty;
    [Column("org_id")]              public string OrgId { get; set; } = string.Empty;
    [Column("product_id")]          public string? ProductId { get; set; }
    [Column("name")]                public string Name { get; set; } = string.Empty;
    [Column("description")]         public string? Description { get; set; }
    [Column("qty")]                 public int Qty { get; set; } = 1;
    [Column("unit_price")]          public decimal UnitPrice { get; set; }
    [Column("notes")]               public string? Notes { get; set; }
    [Column("created_at")]          public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public OrgProduct? Product { get; set; }
}
