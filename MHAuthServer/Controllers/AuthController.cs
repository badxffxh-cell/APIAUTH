using System.IdentityModel.Tokens.Jwt;
using MHAuthServer.Data;
using MHAuthServer.DTOs;
using MHAuthServer.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MHAuthServer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    public AuthController(AppDbContext context) { _context = context; }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest req)
    {
        try {
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(req.Token) as JwtSecurityToken;
            var email = jsonToken?.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
            if (string.IsNullOrEmpty(email)) return BadRequest(new ApiResponse(false, "Token inválido."));

            var app = await _context.Applications.FirstOrDefaultAsync(a => a.Name == email);
            if (app == null) {
                app = new Application { Name = email, OwnerId = Random.Shared.Next(100000, 999999).ToString(), Secret = Guid.NewGuid().ToString("N")[..16].ToUpper() };
                _context.Applications.Add(app);
                await _context.SaveChangesAsync();
            }
            return Ok(new { Success = true, OwnerId = app.OwnerId, Secret = app.Secret });
        } catch (Exception ex) { return BadRequest(new ApiResponse(false, ex.Message)); }
    }

    [HttpPost("license")]
    public async Task<IActionResult> LicenseLogin([FromBody] LicenseLoginRequest req)
    {
        var app = await _context.Applications.FirstOrDefaultAsync(a => a.OwnerId == req.OwnerId && a.Secret == req.Secret);
        if (app == null) return BadRequest(new ApiResponse(false, "OwnerId ou Secret inválidos."));

        var key = await _context.Keys.FirstOrDefaultAsync(k => k.OwnerId == req.OwnerId && k.Key == req.Key);
        if (key == null) return BadRequest(new ApiResponse(false, "Chave de licença inválida."));

        return Ok(new ApiResponse(true, "Licença válida!"));
    }

    [HttpPost("keys/create")]
    public async Task<IActionResult> CreateKey([FromBody] CreateKeyRequest req)
    {
        var app = await _context.Applications.FirstOrDefaultAsync(a => a.OwnerId == req.OwnerId && a.Secret == req.Secret);
        if (app == null) return BadRequest(new ApiResponse(false, "OwnerId ou Secret inválidos."));

        var newKey = new LicenseKey { OwnerId = req.OwnerId, Key = "MH-" + Guid.NewGuid().ToString("N")[..12].ToUpper() };
        _context.Keys.Add(newKey);
        await _context.SaveChangesAsync();
        return Ok(new { Success = true, Key = newKey.Key });
    }
}
