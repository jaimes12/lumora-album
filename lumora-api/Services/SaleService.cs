using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface ISaleService
{
    Task<SaleResponse> CreateAsync(string orgId, CreateSaleRequest req);
    Task<SaleResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<SaleResponse>> GetByOrgAsync(string orgId, string? status = null);
    Task<SaleResponse?> UpdateAsync(string orgId, string id, UpdateSaleRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
}

public class SaleService(LumoraDbContext db) : ISaleService
{
    public async Task<SaleResponse> CreateAsync(string orgId, CreateSaleRequest req)
    {
        var items = req.Items.Select((item, idx) => new SaleItem
        {
            Id = Guid.NewGuid().ToString(),
            Description = item.Description,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            Total = item.Quantity * item.UnitPrice,
            SortOrder = item.SortOrder != 0 ? item.SortOrder : idx
        }).ToList();

        var subtotal = items.Sum(i => i.Total);
        var total = subtotal + req.Tax;

        var sale = new Sale
        {
            Id = Guid.NewGuid().ToString(),
            OrgId = orgId,
            EventId = req.EventId,
            ClientId = req.ClientId,
            Type = req.Type ?? "quote",
            Status = "draft",
            Items = items,
            Subtotal = subtotal,
            Tax = req.Tax,
            Total = total,
            PaidAmount = 0,
            Notes = req.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await db.Sales.AddAsync(sale);
        await db.SaveChangesAsync();
        return ToResponse(sale);
    }

    public async Task<SaleResponse?> GetByIdAsync(string orgId, string id)
    {
        var sale = await db.Sales
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrgId == orgId);
        return sale is null ? null : ToResponse(sale);
    }

    public async Task<IEnumerable<SaleResponse>> GetByOrgAsync(string orgId, string? status = null)
    {
        var query = db.Sales.Include(s => s.Items).Where(s => s.OrgId == orgId);
        if (status is not null) query = query.Where(s => s.Status == status);
        var list = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
        return list.Select(ToResponse);
    }

    public async Task<SaleResponse?> UpdateAsync(string orgId, string id, UpdateSaleRequest req)
    {
        var sale = await db.Sales
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrgId == orgId);
        if (sale is null) return null;

        if (req.Status is not null)
        {
            sale.Status = req.Status;
            if (req.Status == "sent" && sale.SentAt is null)
                sale.SentAt = DateTime.UtcNow;
            if (req.Status == "paid" && sale.PaidAt is null)
                sale.PaidAt = DateTime.UtcNow;
        }

        if (req.Notes is not null) sale.Notes = req.Notes;
        if (req.PaidAmount.HasValue) sale.PaidAmount = req.PaidAmount.Value;

        if (req.Items is not null)
        {
            // Replace items
            db.SaleItems.RemoveRange(sale.Items);
            var newItems = req.Items.Select((item, idx) => new SaleItem
            {
                Id = Guid.NewGuid().ToString(),
                SaleId = sale.Id,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Total = item.Quantity * item.UnitPrice,
                SortOrder = item.SortOrder != 0 ? item.SortOrder : idx
            }).ToList();

            sale.Items = newItems;
            sale.Subtotal = newItems.Sum(i => i.Total);
            sale.Tax = req.Tax ?? sale.Tax;
            sale.Total = sale.Subtotal + sale.Tax;
        }
        else if (req.Tax.HasValue)
        {
            sale.Tax = req.Tax.Value;
            sale.Total = sale.Subtotal + sale.Tax;
        }

        await db.SaveChangesAsync();
        return ToResponse(sale);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var sale = await db.Sales.FirstOrDefaultAsync(s => s.Id == id && s.OrgId == orgId);
        if (sale is null) return false;
        db.Sales.Remove(sale);
        await db.SaveChangesAsync();
        return true;
    }

    private static SaleResponse ToResponse(Sale s) => new(
        s.Id, s.EventId, s.ClientId,
        s.Type, s.Status,
        s.Items.OrderBy(i => i.SortOrder).Select(i => new SaleItemResponse(
            i.Id, i.Description, i.Quantity, i.UnitPrice, i.Total, i.SortOrder
        )).ToList(),
        s.Subtotal, s.Tax, s.Total, s.PaidAmount,
        s.Notes, s.CreatedAt, s.SentAt, s.PaidAt
    );
}
