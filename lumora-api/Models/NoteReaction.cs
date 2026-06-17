using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("note_reactions")]
public class NoteReaction
{
    [Key] [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("note_id")]
    public string NoteId { get; set; } = string.Empty;

    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("user_name")]
    public string UserName { get; set; } = string.Empty;

    [Column("emoji")]
    public string Emoji { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
