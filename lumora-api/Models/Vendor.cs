using Google.Cloud.Firestore;

namespace lumora_api.Models;

[FirestoreData]
public class Vendor
{
    [FirestoreDocumentId] public string Id { get; set; } = string.Empty;
    [FirestoreProperty] public string OrgId { get; set; } = string.Empty;
    [FirestoreProperty] public string Name { get; set; } = string.Empty;
    [FirestoreProperty] public string Category { get; set; } = string.Empty; // catering|foto|venue|musica|decoracion|etc
    [FirestoreProperty] public string? Email { get; set; }
    [FirestoreProperty] public string? Phone { get; set; }
    [FirestoreProperty] public string? Website { get; set; }
    [FirestoreProperty] public string? Notes { get; set; }
    [FirestoreProperty] public double Rating { get; set; }
    [FirestoreProperty] public bool IsActive { get; set; } = true;
    [FirestoreProperty] public Timestamp CreatedAt { get; set; }
}
