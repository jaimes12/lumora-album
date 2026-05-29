using Google.Cloud.Firestore;

namespace lumora_api.Models;

[FirestoreData]
public class Client
{
    [FirestoreDocumentId] public string Id { get; set; } = string.Empty;
    [FirestoreProperty] public string OrgId { get; set; } = string.Empty;
    [FirestoreProperty] public string Name { get; set; } = string.Empty;
    [FirestoreProperty] public string? Email { get; set; }
    [FirestoreProperty] public string? Phone { get; set; }
    [FirestoreProperty] public string? Company { get; set; }
    [FirestoreProperty] public string Stage { get; set; } = "lead"; // lead|prospect|client|vip
    [FirestoreProperty] public string? Notes { get; set; }
    [FirestoreProperty] public List<string> Tags { get; set; } = [];
    [FirestoreProperty] public Timestamp CreatedAt { get; set; }
    [FirestoreProperty] public Timestamp? LastContactAt { get; set; }
}
