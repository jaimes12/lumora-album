using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record CreateContractRequest(
    [Required] string ClientId,
    string? EventId,
    string Template,
    string Title,
    decimal Total,
    string? Notes
);

public record UpdateContractRequest(
    string? Status,
    string? Title,
    decimal? Total,
    string? Notes
);

public record ContractResponse(
    string Id,
    string ClientId,
    string? ClientName,
    string? EventId,
    string Template,
    string Status,
    string Title,
    decimal Total,
    string? Notes,
    DateTime CreatedAt,
    DateTime? SentAt,
    DateTime? SignedAt
);
