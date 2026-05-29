using Google.Cloud.Firestore;

namespace lumora_api.Models;

[FirestoreData]
public class Event
{
    [FirestoreDocumentId] public string Id { get; set; } = string.Empty;
    [FirestoreProperty] public string OrgId { get; set; } = string.Empty;
    [FirestoreProperty] public string Name { get; set; } = string.Empty;
    [FirestoreProperty] public string Type { get; set; } = string.Empty; // boda, xv, corporativo, etc.
    [FirestoreProperty] public string Status { get; set; } = "lead"; // lead|confirmed|in_progress|done|cancelled
    [FirestoreProperty] public string ClientId { get; set; } = string.Empty;
    [FirestoreProperty] public string? VenueId { get; set; }
    [FirestoreProperty] public string? Notes { get; set; }
    [FirestoreProperty] public decimal Budget { get; set; }
    [FirestoreProperty] public int GuestCount { get; set; }
    [FirestoreProperty] public Timestamp EventDate { get; set; }
    [FirestoreProperty] public Timestamp CreatedAt { get; set; }
}
