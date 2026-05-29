using Google.Cloud.Firestore;

namespace lumora_api.Models;

[FirestoreData]
public class Sale
{
    [FirestoreDocumentId] public string Id { get; set; } = string.Empty;
    [FirestoreProperty] public string OrgId { get; set; } = string.Empty;
    [FirestoreProperty] public string EventId { get; set; } = string.Empty;
    [FirestoreProperty] public string ClientId { get; set; } = string.Empty;
    [FirestoreProperty] public string Type { get; set; } = "quote"; // quote|invoice
    [FirestoreProperty] public string Status { get; set; } = "draft"; // draft|sent|signed|paid|cancelled
    [FirestoreProperty] public List<SaleItem> Items { get; set; } = [];
    [FirestoreProperty] public decimal Subtotal { get; set; }
    [FirestoreProperty] public decimal Tax { get; set; }
    [FirestoreProperty] public decimal Total { get; set; }
    [FirestoreProperty] public decimal PaidAmount { get; set; }
    [FirestoreProperty] public string? Notes { get; set; }
    [FirestoreProperty] public Timestamp CreatedAt { get; set; }
    [FirestoreProperty] public Timestamp? SentAt { get; set; }
    [FirestoreProperty] public Timestamp? PaidAt { get; set; }
}

[FirestoreData]
public class SaleItem
{
    [FirestoreProperty] public string Description { get; set; } = string.Empty;
    [FirestoreProperty] public int Quantity { get; set; }
    [FirestoreProperty] public decimal UnitPrice { get; set; }
    [FirestoreProperty] public decimal Total { get; set; }
}
