using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("pipeline_stages")]
public class PipelineStage
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("org_id")]
    public string OrgId { get; set; } = string.Empty;

    [Column("label")]
    public string Label { get; set; } = string.Empty;

    [Column("color")]
    public string Color { get; set; } = "#64748b";

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;
}
