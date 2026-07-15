using System.ComponentModel.DataAnnotations;
namespace lumora_api.DTOs;

public record CreateTripRequest(
    [Required, MinLength(2)] string Name,
    [Required] string Destination,
    DateTime DepartureDate,
    DateTime ReturnDate,
    decimal PricePerPerson,
    int SeatsTotal,
    string? Notes
);

public record UpdateTripRequest(
    string? Name, string? Destination, string? Status,
    DateTime? DepartureDate, DateTime? ReturnDate,
    decimal? PricePerPerson, int? SeatsTotal, string? Notes,
    bool? IsPublic = null, string? Description = null,
    string? PostTitle = null, string? Includes = null,
    string? Location = null, decimal? OfferPrice = null, bool ClearOfferPrice = false
);

public record TripResponse(
    string Id, string Name, string Destination, string Status,
    DateTime DepartureDate, DateTime ReturnDate,
    decimal PricePerPerson, int SeatsTotal,
    string? Notes, DateTime CreatedAt,
    int PassengerCount, int SeatsTaken,
    decimal TotalRevenue, string? CreatedByName,
    bool IsPublic = false, string? Description = null,
    List<TripPhotoInfo>? Photos = null,
    string? PostTitle = null, string? Includes = null,
    string? Location = null, decimal? OfferPrice = null,
    int Views = 0
);

public record TripPhotoInfo(
    string Id, string TripId, string Url, string? Caption, DateTime CreatedAt, int SortOrder = 0
);

public record AddTripPhotoRequest(
    [Required] string ImageData,   // base64
    string? Caption
);

public record ReorderPhotosRequest(
    [Required] List<string> PhotoIds
);

public record PassengerCompanionInfo(
    [Required] string Name,
    bool IsMinor = false,
    int? Age = null
);

public record AddPassengerRequest(
    [Required] string ClientId,
    int Seats = 1,
    decimal? TotalCost = null,
    string? Notes = null,
    List<PassengerCompanionInfo>? Companions = null,
    string? SeatNumber = null
);

public record UpdatePassengerRequest(
    string? Status = null, string? Notes = null,
    decimal? TotalCost = null, int? Seats = null,
    List<PassengerCompanionInfo>? Companions = null,
    string? SeatNumber = null, bool ClearSeatNumber = false
);

public record PassengerInfo(
    string Id, string ClientId, string? ClientName, string? ClientPhone,
    int Seats, decimal TotalCost, decimal Paid, decimal Pending,
    string Status, string? Notes, DateTime CreatedAt,
    List<TripPaymentInfo> Payments,
    List<PassengerCompanionInfo>? Companions = null,
    string? SeatNumber = null
);

public record AddTripPaymentRequest(
    [Required] string Concept,
    [Required] decimal Amount,
    string Method = "transfer",
    DateTime? PaidAt = null
);

public record TripPaymentInfo(
    string Id, string PassengerId, string Concept,
    decimal Amount, string Method, DateTime PaidAt
);

public record UpdateTripPaymentRequest(
    string? Concept = null, decimal? Amount = null, string? Method = null
);

public record TripDetailResponse(
    string Id, string Name, string Destination, string Status,
    DateTime DepartureDate, DateTime ReturnDate,
    decimal PricePerPerson, int SeatsTotal,
    string? Notes, DateTime CreatedAt,
    List<PassengerInfo> Passengers,
    string? CreatedByName,
    List<TripExpenseInfo> Expenses,
    bool IsPublic = false, string? Description = null,
    List<TripPhotoInfo>? Photos = null,
    string? PostTitle = null, string? Includes = null,
    string? Location = null, decimal? OfferPrice = null,
    int Views = 0
);

public record TripExpenseInfo(
    string Id, string Concept, decimal Amount, bool Paid, string? Notes, DateTime CreatedAt
);

public record AddTripExpenseRequest(
    [Required] string Concept,
    [Required] decimal Amount,
    bool Paid = false,
    string? Notes = null
);

public record UpdateTripExpenseRequest(
    string? Concept = null, decimal? Amount = null, bool? Paid = null, string? Notes = null
);
