using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record OrgProductResponse(
    string Id, string Name, string? Description,
    decimal Price, string Unit, string Category, bool Active, DateTime CreatedAt);

public record CreateOrgProductRequest(
    [Required, MinLength(2), MaxLength(200)] string Name,
    string? Description,
    [Range(0, 9999999)] decimal Price,
    [Required] string Unit,
    [Required] string Category);

public record UpdateOrgProductRequest(
    [Required, MinLength(2), MaxLength(200)] string Name,
    string? Description,
    [Range(0, 9999999)] decimal Price,
    [Required] string Unit,
    [Required] string Category,
    bool Active);

public record EventProductResponse(
    string Id, string EventId, string? ProductId,
    string Name, string? Description, int Qty,
    decimal UnitPrice, decimal Total, string? Notes, DateTime CreatedAt);

public record AddEventProductRequest(
    string? ProductId,
    [Required, MinLength(1)] string Name,
    string? Description,
    [Range(1, 10000)] int Qty,
    [Range(0, 9999999)] decimal UnitPrice,
    string? Notes);

public record UpdateEventProductRequest(
    [Required, MinLength(1)] string Name,
    string? Description,
    [Range(1, 10000)] int Qty,
    [Range(0, 9999999)] decimal UnitPrice,
    string? Notes);
