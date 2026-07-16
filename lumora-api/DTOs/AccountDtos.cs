using System.ComponentModel.DataAnnotations;
namespace lumora_api.DTOs;

public record CreateAccountRequest([Required, MinLength(1)] string Name);
public record UpdateAccountRequest([Required, MinLength(1)] string Name);

public record AccountResponse(
    string Id, string Name, DateTime CreatedAt,
    int EntryCount, decimal TotalIngresos, decimal TotalGastos, decimal Balance
);

public record CreateAccountEntryRequest(
    DateTime? EntryDate,
    string? Concept,
    string? Category,
    string? Type, // ingreso | gasto
    decimal Amount = 0,
    string? TripId = null,
    string? Notes = null
);

public record UpdateAccountEntryRequest(
    DateTime? EntryDate = null,
    string? Concept = null,
    string? Category = null,
    string? Type = null,
    decimal? Amount = null,
    string? TripId = null,
    bool ClearTripId = false,
    string? Notes = null
);

public record AccountEntryResponse(
    string Id, string AccountId, DateTime EntryDate, string Concept, string? Category,
    string Type, decimal Amount, string? TripId, string? TripName, string? Notes, DateTime CreatedAt
);
