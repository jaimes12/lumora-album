using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace lumora_api.Services;

public interface IClientService
{
    Task<ClientResponse> CreateAsync(string orgId, CreateClientRequest req);
    Task<ClientResponse?> GetByIdAsync(string orgId, string id);
    Task<ClientResponse?> GetByPhoneAsync(string orgId, string phone);
    Task<IEnumerable<ClientResponse>> GetByOrgAsync(string orgId, string? stage = null);
    Task<ClientResponse?> UpdateAsync(string orgId, string id, UpdateClientRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
}

public class ClientService(LumoraDbContext db) : IClientService
{
    public async Task<ClientResponse> CreateAsync(string orgId, CreateClientRequest req)
    {
        var client = new Client
        {
            Id = Guid.NewGuid().ToString(),
            OrgId = orgId,
            Name = req.Name,
            Email = req.Email,
            Phone = req.Phone,
            Company = req.Company,
            Stage = "lead",
            Notes = req.Notes,
            Tags = JsonSerializer.Serialize(req.Tags ?? []),
            CreatedAt = DateTime.UtcNow
        };
        await db.Clients.AddAsync(client);
        await db.SaveChangesAsync();
        return ToResponse(client);
    }

    public async Task<ClientResponse?> GetByIdAsync(string orgId, string id)
    {
        var c = await db.Clients.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        return c is null ? null : ToResponse(c);
    }

    public async Task<IEnumerable<ClientResponse>> GetByOrgAsync(string orgId, string? stage = null)
    {
        var query = db.Clients.Where(c => c.OrgId == orgId);
        if (stage is not null) query = query.Where(c => c.Stage == stage);
        var list = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return list.Select(ToResponse);
    }

    public async Task<ClientResponse?> UpdateAsync(string orgId, string id, UpdateClientRequest req)
    {
        var c = await db.Clients.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        if (c is null) return null;

        if (req.Name is not null) c.Name = req.Name;
        if (req.Email is not null) c.Email = req.Email;
        if (req.Phone is not null) c.Phone = req.Phone;
        if (req.Company is not null) c.Company = req.Company;
        if (req.Stage is not null) c.Stage = req.Stage;
        if (req.Notes is not null) c.Notes = req.Notes;
        if (req.Tags is not null) c.Tags = JsonSerializer.Serialize(req.Tags);
        c.LastContactAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(c);
    }

    public async Task<ClientResponse?> GetByPhoneAsync(string orgId, string phone)
    {
        var digits = System.Text.RegularExpressions.Regex.Replace(phone, @"\D", "");
        var last10 = digits.Length >= 10 ? digits[^10..] : digits;
        if (last10.Length < 7) return null;
        var c = await db.Clients
            .FirstOrDefaultAsync(x => x.OrgId == orgId && x.Phone != null && x.Phone.EndsWith(last10));
        return c is null ? null : ToResponse(c);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var c = await db.Clients.FirstOrDefaultAsync(x => x.Id == id && x.OrgId == orgId);
        if (c is null) return false;
        db.Clients.Remove(c);
        await db.SaveChangesAsync();
        return true;
    }

    private static ClientResponse ToResponse(Client c) => new(
        c.Id, c.Name, c.Email, c.Phone, c.Company, c.Stage,
        c.Notes,
        JsonSerializer.Deserialize<List<string>>(c.Tags) ?? [],
        c.CreatedAt,
        c.LastContactAt
    );
}
