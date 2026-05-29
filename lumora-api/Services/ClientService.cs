using Google.Cloud.Firestore;
using lumora_api.DTOs;
using lumora_api.Models;

namespace lumora_api.Services;

public interface IClientService
{
    Task<ClientResponse> CreateAsync(string orgId, CreateClientRequest req);
    Task<ClientResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<ClientResponse>> GetByOrgAsync(string orgId, string? stage = null);
    Task<ClientResponse?> UpdateAsync(string orgId, string id, UpdateClientRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
}

public class ClientService(FirestoreDb db) : IClientService
{
    private readonly CollectionReference _col = db.Collection("clients");

    public async Task<ClientResponse> CreateAsync(string orgId, CreateClientRequest req)
    {
        var client = new Client
        {
            OrgId = orgId,
            Name = req.Name,
            Email = req.Email,
            Phone = req.Phone,
            Company = req.Company,
            Stage = "lead",
            Notes = req.Notes,
            Tags = req.Tags ?? [],
            CreatedAt = Timestamp.GetCurrentTimestamp()
        };
        var doc = await _col.AddAsync(client);
        client.Id = doc.Id;
        return ToResponse(client);
    }

    public async Task<ClientResponse?> GetByIdAsync(string orgId, string id)
    {
        var snap = await _col.Document(id).GetSnapshotAsync();
        if (!snap.Exists) return null;
        var c = snap.ConvertTo<Client>();
        c.Id = snap.Id;
        return c.OrgId == orgId ? ToResponse(c) : null;
    }

    public async Task<IEnumerable<ClientResponse>> GetByOrgAsync(string orgId, string? stage = null)
    {
        Query query = _col.WhereEqualTo("OrgId", orgId).OrderByDescending("CreatedAt");
        if (stage is not null) query = query.WhereEqualTo("Stage", stage);
        var snap = await query.GetSnapshotAsync();
        return snap.Documents.Select(d => { var c = d.ConvertTo<Client>(); c.Id = d.Id; return ToResponse(c); });
    }

    public async Task<ClientResponse?> UpdateAsync(string orgId, string id, UpdateClientRequest req)
    {
        var docRef = _col.Document(id);
        var snap = await docRef.GetSnapshotAsync();
        if (!snap.Exists) return null;
        var c = snap.ConvertTo<Client>();
        if (c.OrgId != orgId) return null;

        var updates = new Dictionary<string, object>();
        if (req.Name is not null) updates["Name"] = req.Name;
        if (req.Email is not null) updates["Email"] = req.Email;
        if (req.Phone is not null) updates["Phone"] = req.Phone;
        if (req.Company is not null) updates["Company"] = req.Company;
        if (req.Stage is not null) updates["Stage"] = req.Stage;
        if (req.Notes is not null) updates["Notes"] = req.Notes;
        if (req.Tags is not null) updates["Tags"] = req.Tags;
        updates["LastContactAt"] = Timestamp.GetCurrentTimestamp();

        if (updates.Count > 0) await docRef.UpdateAsync(updates);
        return await GetByIdAsync(orgId, id);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var snap = await _col.Document(id).GetSnapshotAsync();
        if (!snap.Exists) return false;
        var c = snap.ConvertTo<Client>();
        if (c.OrgId != orgId) return false;
        await _col.Document(id).DeleteAsync();
        return true;
    }

    private static ClientResponse ToResponse(Client c) => new(
        c.Id, c.Name, c.Email, c.Phone, c.Company, c.Stage,
        c.Notes, c.Tags, c.CreatedAt.ToDateTime(),
        c.LastContactAt?.ToDateTime()
    );
}
