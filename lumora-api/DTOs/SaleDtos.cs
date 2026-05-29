using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record SaleItemRequest(
    string Description,
    int Quantity,
    decimal UnitPrice,
    int SortOrder = 0
);

public record SaleItemResponse(
    string Id,
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal Total,
    int SortOrder
);

public record CreateSaleRequest(
    string? EventId,
    [Required] string ClientId,
    string Type,
    List<SaleItemRequest> Items,
    decimal Tax,
    string? Notes
);

public record UpdateSaleRequest(
    string? Status,
    List<SaleItemRequest>? Items,
    decimal? Tax,
    string? Notes,
    decimal? PaidAmount
);

public record SaleResponse(
    string Id,
    string? EventId,
    string ClientId,
    string Type,
    string Status,
    List<SaleItemResponse> Items,
    decimal Subtotal,
    decimal Tax,
    decimal Total,
    decimal PaidAmount,
    string? Notes,
    DateTime CreatedAt,
    DateTime? SentAt,
    DateTime? PaidAt
);
