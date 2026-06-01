using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface IContractService
{
    Task<ContractResponse> CreateAsync(string orgId, CreateContractRequest req);
    Task<ContractResponse?> GetByIdAsync(string orgId, string id);
    Task<IEnumerable<ContractResponse>> GetByOrgAsync(string orgId, string? status = null);
    Task<ContractResponse?> UpdateAsync(string orgId, string id, UpdateContractRequest req);
    Task<bool> DeleteAsync(string orgId, string id);
}

public class ContractService(LumoraDbContext db) : IContractService
{
    public async Task<ContractResponse> CreateAsync(string orgId, CreateContractRequest req)
    {
        var contract = new Contract
        {
            Id = Guid.NewGuid().ToString(),
            OrgId = orgId,
            ClientId = req.ClientId,
            EventId = req.EventId,
            Template = req.Template ?? "general",
            Status = "draft",
            Title = req.Title ?? string.Empty,
            Total = req.Total,
            Notes = req.Notes,
            CreatedAt = DateTime.UtcNow
        };
        await db.Contracts.AddAsync(contract);
        await db.SaveChangesAsync();
        var client = await db.Clients.FindAsync(req.ClientId);
        return ToResponse(contract, client?.Name);
    }

    public async Task<ContractResponse?> GetByIdAsync(string orgId, string id)
    {
        var contract = await db.Contracts
            .Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrgId == orgId);
        return contract is null ? null : ToResponse(contract, contract.Client?.Name);
    }

    public async Task<IEnumerable<ContractResponse>> GetByOrgAsync(string orgId, string? status = null)
    {
        var query = db.Contracts.Include(c => c.Client).Where(c => c.OrgId == orgId);
        if (status is not null) query = query.Where(c => c.Status == status);
        var list = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return list.Select(c => ToResponse(c, c.Client?.Name));
    }

    public async Task<ContractResponse?> UpdateAsync(string orgId, string id, UpdateContractRequest req)
    {
        var contract = await db.Contracts.Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrgId == orgId);
        if (contract is null) return null;

        if (req.Status is not null) contract.Status = req.Status;
        if (req.Title is not null) contract.Title = req.Title;
        if (req.Total.HasValue) contract.Total = req.Total.Value;
        if (req.Notes is not null) contract.Notes = req.Notes;

        if (req.Status == "sent" && contract.SentAt is null)
            contract.SentAt = DateTime.UtcNow;
        if (req.Status == "signed" && contract.SignedAt is null)
            contract.SignedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(contract, contract.Client?.Name);
    }

    public async Task<bool> DeleteAsync(string orgId, string id)
    {
        var contract = await db.Contracts.FirstOrDefaultAsync(c => c.Id == id && c.OrgId == orgId);
        if (contract is null) return false;
        db.Contracts.Remove(contract);
        await db.SaveChangesAsync();
        return true;
    }

    private static ContractResponse ToResponse(Contract c, string? clientName) => new(
        c.Id, c.ClientId, clientName,
        c.EventId, c.Template, c.Status, c.Title,
        c.Total, c.Notes, c.CreatedAt, c.SentAt, c.SignedAt
    );
}
