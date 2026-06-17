using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("support_messages")]
public class SupportMessage
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("ticket_id")]
    public string TicketId { get; set; } = string.Empty;

    [Column("author_role")]
    public string AuthorRole { get; set; } = "user"; // user | admin

    [Column("author_name")]
    public string AuthorName { get; set; } = string.Empty;

    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
