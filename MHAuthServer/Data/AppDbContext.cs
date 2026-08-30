using Microsoft.EntityFrameworkCore;
using MHAuthServer.Models;
namespace MHAuthServer.Data;
public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<LicenseKey> Keys => Set<LicenseKey>();
}
