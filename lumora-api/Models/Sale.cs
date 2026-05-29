using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("sales")]
public class Sale
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("event_id")]
    public string? EventId { get; set; }

    [Column("client_id")]
    public string ClientId { get; set; } = string.Empty;

    [Column("type")]
    public string Type { get; set; } = "quote"; // quote|invoice

    [Column("status")]
    public string Status { get; set; } = "draft"; // draft|sent|signed|paid|cancelled

    [Column("subtotal")]
    public decimal Subtotal { get; set; }

    [Column("tax")]
    public decimal Tax { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("paid_amount")]
    public decimal PaidAmount { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("sent_at")]
    public DateTime? SentAt { get; set; }

    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }

    public ICollection<SaleItem> Items { get; set; } = [];
    public Client? Client { get; set; }
}

[Table("sale_items")]
public class SaleItem
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("sale_id")]
    public string SaleId { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("quantity")]
    public int Quantity { get; set; } = 1;

    [Column("unit_price")]
    public decimal UnitPrice { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("sort_order")]
    public int SortOrder { get; set; }

    public Sale? Sale { get; set; }
}
