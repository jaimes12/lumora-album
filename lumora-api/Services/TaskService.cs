using lumora_api.Data;
using lumora_api.DTOs;
using lumora_api.Models;
using Microsoft.EntityFrameworkCore;

namespace lumora_api.Services;

public interface ITaskService
{
    Task<List<TaskResponse>> GetAllAsync(string orgId);
    Task<TaskResponse> CreateAsync(string orgId, CreateTaskRequest req);
    Task ToggleAsync(string orgId, string id);
    Task DeleteAsync(string orgId, string id);
}

public class TaskService(LumoraDbContext db) : ITaskService
{
    public async Task<List<TaskResponse>> GetAllAsync(string orgId)
        => await db.OrgTasks
            .Where(t => t.OrgId == orgId)
            .OrderBy(t => t.Completed)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TaskResponse(t.Id, t.Text, t.Completed, t.CreatedAt))
            .ToListAsync();

    public async Task<TaskResponse> CreateAsync(string orgId, CreateTaskRequest req)
    {
        var task = new OrgTask
        {
            Id        = Guid.NewGuid().ToString(),
            OrgId     = orgId,
            Text      = req.Text.Trim(),
            Completed = false,
            CreatedAt = DateTime.UtcNow,
        };
        db.OrgTasks.Add(task);
        await db.SaveChangesAsync();
        return new TaskResponse(task.Id, task.Text, task.Completed, task.CreatedAt);
    }

    public async Task ToggleAsync(string orgId, string id)
    {
        var task = await db.OrgTasks.FirstOrDefaultAsync(t => t.OrgId == orgId && t.Id == id);
        if (task is null) return;
        task.Completed = !task.Completed;
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(string orgId, string id)
    {
        var task = await db.OrgTasks.FirstOrDefaultAsync(t => t.OrgId == orgId && t.Id == id);
        if (task is null) return;
        db.OrgTasks.Remove(task);
        await db.SaveChangesAsync();
    }
}
