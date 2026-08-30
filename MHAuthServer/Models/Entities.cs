namespace MHAuthServer.Models;
public class Application { public int Id { get; set; } public string Name { get; set; } = string.Empty; public string OwnerId { get; set; } = string.Empty; public string Secret { get; set; } = string.Empty; }
public class LicenseKey { public int Id { get; set; } public string OwnerId { get; set; } = string.Empty; public string Key { get; set; } = string.Empty; public bool IsUsed { get; set; } = false; public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
