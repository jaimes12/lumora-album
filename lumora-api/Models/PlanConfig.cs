using System.ComponentModel.DataAnnotations.Schema;

namespace lumora_api.Models;

[Table("plan_configs")]
public class PlanConfig
{
    [Column("id")]          public string Id          { get; set; } = Guid.NewGuid().ToString();
    [Column("plan_id")]     public string PlanId      { get; set; } = "";
    [Column("name")]        public string Name        { get; set; } = "";
    [Column("price")]       public int    Price       { get; set; }
    [Column("description")] public string Description { get; set; } = "";
    [Column("color")]       public string Color       { get; set; } = "#7c6af7";
    [Column("popular")]     public bool   Popular     { get; set; }
    [Column("features", TypeName = "json")] public string FeaturesJson { get; set; } = "[]";
    [Column("sort_order")]  public int    SortOrder   { get; set; }
    [Column("updated_at")]  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
