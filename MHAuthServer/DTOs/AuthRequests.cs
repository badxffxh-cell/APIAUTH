namespace MHAuthServer.DTOs;
public record GoogleLoginRequest(string Token);
public record LicenseLoginRequest(string OwnerId, string Secret, string Key, string Hwid);
public record CreateKeyRequest(string OwnerId, string Secret);
public record ApiResponse(bool Success, string Message);
