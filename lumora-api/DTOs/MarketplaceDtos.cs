using System.ComponentModel.DataAnnotations;
namespace lumora_api.DTOs;

public record MarketplaceTripSummary(
    string Id, string Name, string Destination,
    DateTime DepartureDate, DateTime ReturnDate,
    decimal PricePerPerson, int SeatsTotal, int SeatsTaken,
    string? CoverPhotoUrl,
    string AgencyName, string? AgencyCity
);

public record MarketplaceTripDetail(
    string Id, string Name, string Destination,
    DateTime DepartureDate, DateTime ReturnDate,
    decimal PricePerPerson, int SeatsTotal, int SeatsTaken,
    string? Description,
    List<TripPhotoInfo> Photos,
    string AgencyName, string? AgencyCity,
    string? AgencyPhone, string? AgencyEmail,
    List<string> Includes
);

public record MarketplaceInquiryRequest(
    [Required, MinLength(2)] string Name,
    [Required, MinLength(7)] string Phone,
    [Required, MinLength(3)] string Message
);
