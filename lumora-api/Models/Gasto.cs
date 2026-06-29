using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("gastos")]
public class Gasto
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("event_id")]
    public string? EventId { get; set; }

    [Column("descripcion")]
    public string Descripcion { get; set; } = string.Empty;

    [Column("monto")]
    public decimal Monto { get; set; }

    [Column("categoria")]
    public string Categoria { get; set; } = "general"; // general|proveedor|renta|personal|marketing|otro

    [Column("fecha")]
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [Column("notas")]
    public string? Notas { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Event? Event { get; set; }
}
