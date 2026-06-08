using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("org_products")]
public class OrgProduct
{
    [Key, Column("id")]             public string Id { get; set; } = Guid.NewGuid().ToString();
    [Column("org_id")]              public string OrgId { get; set; } = string.Empty;
    [Column("name")]                public string Name { get; set; } = string.Empty;
    [Column("description")]         public string? Description { get; set; }
    [Column("price")]               public decimal Price { get; set; }
    [Column("unit")]                public string Unit { get; set; } = "pieza";
    [Column("category")]            public string Category { get; set; } = "servicio"; // producto | servicio
    [Column("active")]              public bool Active { get; set; } = true;
    [Column("created_at")]          public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
