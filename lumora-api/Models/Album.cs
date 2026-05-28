using Google.Cloud.Firestore;

namespace lumora_api.Models;

[FirestoreData]
public class Album
{
    [FirestoreDocumentId]
    public string Id { get; set; } = string.Empty;

    [FirestoreProperty]
    public string Name { get; set; } = string.Empty;

    [FirestoreProperty]
    public string Description { get; set; } = string.Empty;

    [FirestoreProperty]
    public string OwnerId { get; set; } = string.Empty;

    [FirestoreProperty]
    public string OwnerEmail { get; set; } = string.Empty;

    [FirestoreProperty]
    public string AccessCode { get; set; } = string.Empty;

    [FirestoreProperty]
    public bool IsActive { get; set; } = true;

    [FirestoreProperty]
    public Timestamp CreatedAt { get; set; }

    [FirestoreProperty]
    public Timestamp? EventDate { get; set; }
}
