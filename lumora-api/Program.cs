using System.Text;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using lumora_api.Data;
using lumora_api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
// Lumora — Event Management Platform

var builder = WebApplication.CreateBuilder(args);

var projectId = builder.Configuration["Firebase:ProjectId"] ?? "lumora-placeholder";
var firebaseCredentials = builder.Configuration["Firebase:CredentialsJson"];
var firebaseConfigured = !string.IsNullOrWhiteSpace(firebaseCredentials)
    && !string.IsNullOrWhiteSpace(builder.Configuration["Firebase:ProjectId"]);

// Firebase init — only for JWT auth, NOT for database
if (firebaseConfigured)
{
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromJson(firebaseCredentials)
    });
}

// MySQL / EF Core
var connectionString =
    builder.Configuration.GetConnectionString("MySql")
    ?? Environment.GetEnvironmentVariable("MYSQL_URL")
    ?? "Server=zephyr.proxy.rlwy.net;Port=22140;Database=railway;User=root;Password=ieVDKlaSitDJTjSPqxlhDtdNchFHoLgE;AllowPublicKeyRetrieval=true;SslMode=none;";

builder.Services.AddDbContext<LumoraDbContext>(opts =>
    opts.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
        mySqlOpts => mySqlOpts.EnableRetryOnFailure(3)));

// Business services
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IWhatsappService, WhatsappService>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<ILeadService, LeadService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Auth
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "lumora-dev-secret-key-change-in-production-32chars";

if (firebaseConfigured)
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = $"https://securetoken.google.com/{projectId}";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://securetoken.google.com/{projectId}",
                ValidateAudience = true,
                ValidAudience = projectId,
                ValidateLifetime = true
            };
        });
}
else
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opts =>
        {
            opts.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = "lumora-api",
                ValidateAudience = true,
                ValidAudience = "lumora-web",
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
            };
        });
}

builder.Services.AddAuthorization();

// CORS
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
    )
);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Lumora API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 25 * 1024 * 1024;
});

var app = builder.Build();

// Auto-migrate / ensure schema exists
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LumoraDbContext>();
    await db.Database.EnsureCreatedAsync();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "lumora-api",
    database = "mysql",
    firebase = firebaseConfigured ? "connected" : "not configured"
}));

app.Run();
