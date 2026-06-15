using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("org_settings")]
public class OrgSettings
{
    [Key]
    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("company_name")]
    public string CompanyName { get; set; } = string.Empty;

    [Column("rfc")]
    public string Rfc { get; set; } = string.Empty;

    [Column("director_name")]
    public string DirectorName { get; set; } = string.Empty;

    [Column("phone")]
    public string Phone { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("city")]
    public string City { get; set; } = string.Empty;

    [Column("address")]
    public string Address { get; set; } = string.Empty;
}
