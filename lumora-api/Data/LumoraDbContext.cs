using lumora_api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace lumora_api.Data;

public class LumoraDbContext(DbContextOptions<LumoraDbContext> options) : DbContext(options)
{
    // Pomelo 8.x auto-detects GUID-formatted strings and converts them to System.Guid.
    // Overriding the convention forces all string properties to use varchar,
    // preventing the "Unable to cast System.Guid to System.String" error.
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<string>().HaveColumnType("varchar(500)");
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<WhatsappChat> WhatsappChats => Set<WhatsappChat>();
    public DbSet<WhatsappMessage> WhatsappMessages => Set<WhatsappMessage>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<LeadMessage> LeadMessages => Set<LeadMessage>();
    public DbSet<EventPayment> EventPayments => Set<EventPayment>();
    public DbSet<EventPhoto> EventPhotos => Set<EventPhoto>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // Organization -> Clients
        mb.Entity<Client>()
            .HasOne(c => c.Organization)
            .WithMany(o => o.Clients)
            .HasForeignKey(c => c.OrgId)
            .OnDelete(DeleteBehavior.Cascade);

        // Organization -> Events
        mb.Entity<Event>()
            .HasOne(e => e.Organization)
            .WithMany(o => o.Events)
            .HasForeignKey(e => e.OrgId)
            .OnDelete(DeleteBehavior.Cascade);

        // Client -> Events
        mb.Entity<Event>()
            .HasOne(e => e.Client)
            .WithMany(c => c.Events)
            .HasForeignKey(e => e.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        // Sale -> SaleItems
        mb.Entity<SaleItem>()
            .HasOne(i => i.Sale)
            .WithMany(s => s.Items)
            .HasForeignKey(i => i.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        // Sale -> Client
        mb.Entity<Sale>()
            .HasOne(s => s.Client)
            .WithMany()
            .HasForeignKey(s => s.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        // User -> Organization
        mb.Entity<User>()
            .HasOne(u => u.Organization)
            .WithMany()
            .HasForeignKey(u => u.OrgId)
            .OnDelete(DeleteBehavior.Cascade);

        // WhatsappChat -> WhatsappMessages
        mb.Entity<WhatsappMessage>()
            .HasOne(m => m.Chat)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        // Contract -> Client
        mb.Entity<Contract>()
            .HasOne(c => c.Client)
            .WithMany()
            .HasForeignKey(c => c.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        // Contract -> Event (nullable)
        mb.Entity<Contract>()
            .HasOne(c => c.Event)
            .WithMany()
            .HasForeignKey(c => c.EventId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Lead -> LeadMessages
        mb.Entity<LeadMessage>()
            .HasOne(m => m.Lead)
            .WithMany(l => l.Messages)
            .HasForeignKey(m => m.LeadId)
            .OnDelete(DeleteBehavior.Cascade);

        // EventPayment -> Event
        mb.Entity<EventPayment>()
            .HasOne(p => p.Event)
            .WithMany()
            .HasForeignKey(p => p.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // EventPhoto -> Event
        mb.Entity<EventPhoto>()
            .HasOne(p => p.Event)
            .WithMany()
            .HasForeignKey(p => p.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Pomelo 8.x GUID fix ──────────────────────────────────────────────
        // HasConversion<string>() on a string property is a no-op in EF Core (identity
        // conversion is discarded), so property.GetValueConverter() stays null and Pomelo
        // falls back to reader.GetGuid() for char(36) columns → cast exception.
        // Using an explicit ValueConverter instance forces a non-null converter, which
        // makes Pomelo call GetString() regardless of the underlying MySQL column type.
        var stringConverter = new ValueConverter<string, string>(v => v, v => v);
        foreach (var entityType in mb.Model.GetEntityTypes().ToList())
        {
            foreach (var property in entityType.GetProperties()
                .Where(p => p.ClrType == typeof(string))
                .ToList())
            {
                var colType = property.GetColumnType();
                if (colType != null && colType.StartsWith("json", StringComparison.OrdinalIgnoreCase))
                    continue;

                mb.Entity(entityType.ClrType)
                    .Property(property.Name)
                    .HasConversion(stringConverter);
            }
        }
    }
}
