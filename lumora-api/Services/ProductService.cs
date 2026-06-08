using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface IProductService
{
    // Catalog
    Task<List<OrgProductResponse>> GetCatalogAsync(string orgId);
    Task<OrgProductResponse> CreateCatalogItemAsync(string orgId, CreateOrgProductRequest req);
    Task<OrgProductResponse?> UpdateCatalogItemAsync(string orgId, string id, UpdateOrgProductRequest req);
    Task<bool> DeleteCatalogItemAsync(string orgId, string id);

    // Event products
    Task<List<EventProductResponse>> GetEventProductsAsync(string orgId, string eventId);
    Task<EventProductResponse> AddEventProductAsync(string orgId, string eventId, AddEventProductRequest req);
    Task<EventProductResponse?> UpdateEventProductAsync(string orgId, string id, UpdateEventProductRequest req);
    Task<bool> DeleteEventProductAsync(string orgId, string id);
}

public class ProductService(LumoraDbContext db) : IProductService
{
    // ── Catalog ──────────────────────────────────────────────────────────────

    public async Task<List<OrgProductResponse>> GetCatalogAsync(string orgId)
        => await db.OrgProducts
            .Where(p => p.OrgId == orgId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToResponse(p))
            .ToListAsync();

    public async Task<OrgProductResponse> CreateCatalogItemAsync(string orgId, CreateOrgProductRequest req)
    {
        var p = new OrgProduct {
            OrgId       = orgId,
            Name        = req.Name.Trim(),
            Description = req.Description?.Trim(),
            Price       = req.Price,
            Unit        = req.Unit,
            Category    = req.Category,
        };
        db.OrgProducts.Add(p);
        await db.SaveChangesAsync();
        return ToResponse(p);
    }

    public async Task<OrgProductResponse?> UpdateCatalogItemAsync(string orgId, string id, UpdateOrgProductRequest req)
    {
        var p = await db.OrgProducts.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        if (p is null) return null;
        p.Name        = req.Name.Trim();
        p.Description = req.Description?.Trim();
        p.Price       = req.Price;
        p.Unit        = req.Unit;
        p.Category    = req.Category;
        p.Active      = req.Active;
        await db.SaveChangesAsync();
        return ToResponse(p);
    }

    public async Task<bool> DeleteCatalogItemAsync(string orgId, string id)
    {
        var p = await db.OrgProducts.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        if (p is null) return false;
        db.OrgProducts.Remove(p);
        await db.SaveChangesAsync();
        return true;
    }

    // ── Event products ────────────────────────────────────────────────────────

    public async Task<List<EventProductResponse>> GetEventProductsAsync(string orgId, string eventId)
        => await db.EventProducts
            .Where(p => p.OrgId == orgId && p.EventId == eventId)
            .OrderBy(p => p.CreatedAt)
            .Select(p => ToEventResponse(p))
            .ToListAsync();

    public async Task<EventProductResponse> AddEventProductAsync(string orgId, string eventId, AddEventProductRequest req)
    {
        var ep = new EventProduct {
            EventId     = eventId,
            OrgId       = orgId,
            ProductId   = req.ProductId,
            Name        = req.Name.Trim(),
            Description = req.Description?.Trim(),
            Qty         = req.Qty,
            UnitPrice   = req.UnitPrice,
            Notes       = req.Notes?.Trim(),
        };
        db.EventProducts.Add(ep);
        await db.SaveChangesAsync();
        return ToEventResponse(ep);
    }

    public async Task<EventProductResponse?> UpdateEventProductAsync(string orgId, string id, UpdateEventProductRequest req)
    {
        var ep = await db.EventProducts.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        if (ep is null) return null;
        ep.Name        = req.Name.Trim();
        ep.Description = req.Description?.Trim();
        ep.Qty         = req.Qty;
        ep.UnitPrice   = req.UnitPrice;
        ep.Notes       = req.Notes?.Trim();
        await db.SaveChangesAsync();
        return ToEventResponse(ep);
    }

    public async Task<bool> DeleteEventProductAsync(string orgId, string id)
    {
        var ep = await db.EventProducts.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        if (ep is null) return false;
        db.EventProducts.Remove(ep);
        await db.SaveChangesAsync();
        return true;
    }

    private static OrgProductResponse ToResponse(OrgProduct p) =>
        new(p.Id, p.Name, p.Description, p.Price, p.Unit, p.Category, p.Active, p.CreatedAt);

    private static EventProductResponse ToEventResponse(EventProduct ep) =>
        new(ep.Id, ep.EventId, ep.ProductId, ep.Name, ep.Description, ep.Qty, ep.UnitPrice, ep.Qty * ep.UnitPrice, ep.Notes, ep.CreatedAt);
}
