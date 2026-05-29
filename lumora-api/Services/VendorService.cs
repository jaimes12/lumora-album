using Google.Cloud.Firestore;
using lumora_api.DTOs;
using lumora_api.Models;

namespace lumora_api.Services;

public interface IVendorService
{
    Task<VendorResponse> CreateAsync(string orgId, CreateVendorRequest req);
    Task<VendorResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<VendorResponse>> GetByOrgAsync(string orgId, string? category = null);
    Task<VendorResponse?> UpdateAsync(string orgId, string id, UpdateVendorRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
}

public class VendorService(FirestoreDb db) : IVendorService
{
    private readonly CollectionReference _col = db.Collection("vendors");

    public async Task<VendorResponse> CreateAsync(string orgId, CreateVendorRequest req)
    {
        var vendor = new Vendor
        {
            OrgId = orgId,
            Name = req.Name,
            Category = req.Category,
            Email = req.Email,
            Phone = req.Phone,
            Website = req.Website,
            Notes = req.Notes,
            Rating = 0,
            IsActive = true,
            CreatedAt = Timestamp.GetCurrentTimestamp()
        };
        var doc = await _col.AddAsync(vendor);
        vendor.Id = doc.Id;
        return ToResponse(vendor);
    }

    public async Task<VendorResponse?> GetByIdAsync(string orgId, string id)
    {
        var snap = await _col.Document(id).GetSnapshotAsync();
        if (!snap.Exists) return null;
        var v = snap.ConvertTo<Vendor>();
        v.Id = snap.Id;
        return v.OrgId == orgId ? ToResponse(v) : null;
    }

    public async Task<IEnumerable<VendorResponse>> GetByOrgAsync(string orgId, string? category = null)
    {
        Query query = _col.WhereEqualTo("OrgId", orgId).OrderBy("Name");
        if (category is not null) query = query.WhereEqualTo("Category", category);
        var snap = await query.GetSnapshotAsync();
        return snap.Documents.Select(d => { var v = d.ConvertTo<Vendor>(); v.Id = d.Id; return ToResponse(v); });
    }

    public async Task<VendorResponse?> UpdateAsync(string orgId, string id, UpdateVendorRequest req)
    {
        var docRef = _col.Document(id);
        var snap = await docRef.GetSnapshotAsync();
        if (!snap.Exists) return null;
        var v = snap.ConvertTo<Vendor>();
        if (v.OrgId != orgId) return null;

        var updates = new Dictionary<string, object>();
        if (req.Name is not null) updates["Name"] = req.Name;
        if (req.Category is not null) updates["Category"] = req.Category;
        if (req.Email is not null) updates["Email"] = req.Email;
        if (req.Phone is not null) updates["Phone"] = req.Phone;
        if (req.Website is not null) updates["Website"] = req.Website;
        if (req.Notes is not null) updates["Notes"] = req.Notes;
        if (req.Rating.HasValue) updates["Rating"] = req.Rating.Value;
        if (req.IsActive.HasValue) updates["IsActive"] = req.IsActive.Value;

        if (updates.Count > 0) await docRef.UpdateAsync(updates);
        return await GetByIdAsync(orgId, id);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var snap = await _col.Document(id).GetSnapshotAsync();
        if (!snap.Exists) return false;
        var v = snap.ConvertTo<Vendor>();
        if (v.OrgId != orgId) return false;
        await _col.Document(id).DeleteAsync();
        return true;
    }

    private static VendorResponse ToResponse(Vendor v) => new(
        v.Id, v.Name, v.Category, v.Email, v.Phone,
        v.Website, v.Notes, v.Rating, v.IsActive, v.CreatedAt.ToDateTime()
    );
}
