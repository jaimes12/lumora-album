using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("whatsapp_chats")]
public class WhatsappChat
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("client_id")]
    public string? ClientId { get; set; }

    [Column("phone")]
    public string Phone { get; set; } = string.Empty;

    [Column("contact_name")]
    public string? ContactName { get; set; }

    [Column("status")]
    public string Status { get; set; } = "open"; // open|closed|archived

    [Column("last_message_at")]
    public DateTime? LastMessageAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WhatsappMessage> Messages { get; set; } = [];
}

[Table("whatsapp_messages")]
public class WhatsappMessage
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("chat_id")]
    public string ChatId { get; set; } = string.Empty;

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("direction")]
    public string Direction { get; set; } = "inbound"; // inbound|outbound

    [Column("body")]
    public string Body { get; set; } = string.Empty;

    [Column("media_url")]
    public string? MediaUrl { get; set; }

    [Column("status")]
    public string Status { get; set; } = "received"; // received|sent|delivered|read

    [Column("sent_at")]
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public WhatsappChat? Chat { get; set; }
}
