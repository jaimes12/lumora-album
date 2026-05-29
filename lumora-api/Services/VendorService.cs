using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface IVendorService
{
    Task<VendorResponse> CreateAsync(string orgId, CreateVendorRequest req);
    Task<VendorResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<VendorResponse>> GetByOrgAsync(string orgId, string? category = null);
    Task<VendorResponse?> UpdateAsync(string orgId, string id, UpdateVendorRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
}

public class VendorService(LumoraDbContext db) : IVendorService
{
    public async Task<VendorResponse> CreateAsync(string orgId, CreateVendorRequest req)
    {
        var vendor = new Vendor
        {
            Id = Guid.NewGuid().ToString(),
            OrgId = orgId,
            Name = req.Name,
            Category = req.Category,
            Email = req.Email,
            Phone = req.Phone,
            Website = req.Website,
            Notes = req.Notes,
            Rating = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        await db.Vendors.AddAsync(vendor);
        await db.SaveChangesAsync();
        return ToResponse(vendor);
    }

    public async Task<VendorResponse?> GetByIdAsync(string orgId, string id)
    {
        var v = await db.Vendors.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        return v is null ? null : ToResponse(v);
    }

    public async Task<IEnumerable<VendorResponse>> GetByOrgAsync(string orgId, string? category = null)
    {
        var query = db.Vendors.Where(v => v.OrgId == orgId);
        if (category is not null) query = query.Where(v => v.Category == category);
        var list = await query.OrderBy(v => v.Name).ToListAsync();
        return list.Select(ToResponse);
    }

    public async Task<VendorResponse?> UpdateAsync(string orgId, string id, UpdateVendorRequest req)
    {
        var v = await db.Vendors.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        if (v is null) return null;

        if (req.Name is not null) v.Name = req.Name;
        if (req.Category is not null) v.Category = req.Category;
        if (req.Email is not null) v.Email = req.Email;
        if (req.Phone is not null) v.Phone = req.Phone;
        if (req.Website is not null) v.Website = req.Website;
        if (req.Notes is not null) v.Notes = req.Notes;
        if (req.Rating.HasValue) v.Rating = (decimal)req.Rating.Value;
        if (req.IsActive.HasValue) v.IsActive = req.IsActive.Value;

        await db.SaveChangesAsync();
        return ToResponse(v);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var v = await db.Vendors.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        if (v is null) return false;
        db.Vendors.Remove(v);
        await db.SaveChangesAsync();
        return true;
    }

    private static VendorResponse ToResponse(Vendor v) => new(
        v.Id, v.Name, v.Category, v.Email, v.Phone,
        v.Website, v.Notes, (double)v.Rating, v.IsActive, v.CreatedAt
    );
}
