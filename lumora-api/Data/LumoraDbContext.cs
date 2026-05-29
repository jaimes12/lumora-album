using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Data;

public class LumoraDbContext(DbContextOptions<LumoraDbContext> options) : DbContext(options)
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<WhatsappChat> WhatsappChats => Set<WhatsappChat>();
    public DbSet<WhatsappMessage> WhatsappMessages => Set<WhatsappMessage>();

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
    }
}
