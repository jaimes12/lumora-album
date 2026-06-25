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
    decimal? PricePerPerson, int? SeatsTotal, string? Notes
);

public record TripResponse(
    string Id, string Name, string Destination, string Status,
    DateTime DepartureDate, DateTime ReturnDate,
    decimal PricePerPerson, int SeatsTotal,
    string? Notes, DateTime CreatedAt,
    int PassengerCount, int SeatsTaken,
    decimal TotalRevenue, string? CreatedByName
);

public record AddPassengerRequest(
    [Required] string ClientId,
    int Seats = 1,
    decimal? TotalCost = null,
    string? Notes = null
);

public record UpdatePassengerRequest(
    string? Status = null, string? Notes = null,
    decimal? TotalCost = null, int? Seats = null
);

public record PassengerInfo(
    string Id, string ClientId, string? ClientName, string? ClientPhone,
    int Seats, decimal TotalCost, decimal Paid, decimal Pending,
    string Status, string? Notes, DateTime CreatedAt,
    List<TripPaymentInfo> Payments
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
    List<TripExpenseInfo> Expenses
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
