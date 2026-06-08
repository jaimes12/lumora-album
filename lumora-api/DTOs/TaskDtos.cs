using System.ComponentModel.DataAnnotations;

namespace lumora_api.DTOs;

public record CreateTaskRequest([Required, MaxLength(500)] string Text);
public record TaskResponse(string Id, string Text, bool Completed, DateTime CreatedAt);
