using System.ComponentModel.DataAnnotations;
using lumora_api.Models;

namespace lumora_api.DTOs;

public record CreateSaleRequest(
    [Required] string EventId,
    [Required] string ClientId,
    string Type,
    List<SaleItem> Items,
    decimal Tax,
    string? Notes
);

public record UpdateSaleRequest(
    string? Status, List<SaleItem>? Items,
    decimal? Tax, string? Notes, decimal? PaidAmount
);

public record SaleResponse(
    string Id, string EventId, string ClientId,
    string Type, string Status,
    List<SaleItem> Items,
    decimal Subtotal, decimal Tax, decimal Total, decimal PaidAmount,
    string? Notes, DateTime CreatedAt, DateTime? SentAt, DateTime? PaidAt
);
