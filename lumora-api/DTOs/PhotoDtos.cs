using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record UploadPhotoRequest(
    [Required, MinLength(1), MaxLength(50)] string UploaderName,
    [MaxLength(200)] string? Caption
);

public record PhotoResponse(
    string Id,
    string AlbumId,
    string Url,
    string ThumbnailUrl,
    string UploaderName,
    string? Caption,
    long SizeBytes,
    DateTime UploadedAt
);
