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

// GuidFormat=None: tells MySqlConnector never to auto-convert char(36) values to System.Guid.
// Without this, Pomelo calls reader.GetGuid() for char(36) columns and EF Core then
// fails to assign the resulting System.Guid to a string property.
if (!connectionString.Contains("GuidFormat", StringComparison.OrdinalIgnoreCase))
    connectionString += ";GuidFormat=None";

// Use hardcoded version — AutoDetect makes a sync DB call at startup and can crash the app
builder.Services.AddDbContext<LumoraDbContext>(opts =>
    opts.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 35)),
        mySqlOpts => mySqlOpts.EnableRetryOnFailure(5)));

// WhatsApp server HTTP client
var waServerUrl = builder.Configuration["WaServerUrl"]
    ?? Environment.GetEnvironmentVariable("WA_SERVER_URL")
    ?? "https://whatsapp-production-117e.up.railway.app";
builder.Services.AddHttpClient("wa", c =>
{
    c.BaseAddress = new Uri(waServerUrl);
    c.Timeout = TimeSpan.FromSeconds(15);
});

// Business services
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IWhatsappService, WhatsappService>();
builder.Services.AddScoped<IWaServerService, WaServerService>();
builder.Services.AddScoped<IR2Service, R2Service>();
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

// CORS — allow configured origins + any Railway subdomain + localhost
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

// Extra origins from environment variable (comma-separated)
var envOrigins = (Environment.GetEnvironmentVariable("CORS_ORIGINS") ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

var allOrigins = allowedOrigins.Concat(envOrigins).ToHashSet(StringComparer.OrdinalIgnoreCase);

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(policy =>
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (allOrigins.Contains(origin)) return true;
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                // Allow any Railway subdomain and localhost
                return uri.Host.EndsWith(".up.railway.app", StringComparison.OrdinalIgnoreCase)
                    || uri.Host == "localhost"
                    || uri.Host == "127.0.0.1";
            })
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
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<LumoraDbContext>();

    // EnsureCreatedAsync only creates tables when the whole DB is brand-new.
    // For existing DBs that are missing tables added later, we run explicit
    // CREATE TABLE IF NOT EXISTS for every entity — fully idempotent.
    var startupSql = new[]
    {
        // ── CREATE TABLE IF NOT EXISTS ──────────────────────────────────────
        @"CREATE TABLE IF NOT EXISTS `organizations` (
            `id`         varchar(255) NOT NULL,
            `name`       varchar(500) NOT NULL,
            `plan`       varchar(500) NOT NULL DEFAULT 'free',
            `created_at` datetime(6)  NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `users` (
            `id`            varchar(255) NOT NULL,
            `org_id`        varchar(255) NOT NULL,
            `email`         varchar(500) NOT NULL,
            `name`          varchar(500) NOT NULL,
            `role`          varchar(500) NOT NULL DEFAULT 'member',
            `created_at`    datetime(6)  NOT NULL,
            `password_hash` varchar(500) NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `clients` (
            `id`              varchar(255) NOT NULL,
            `org_id`          varchar(255) NOT NULL,
            `name`            varchar(500) NOT NULL,
            `email`           varchar(500) NULL,
            `phone`           varchar(500) NULL,
            `company`         varchar(500) NULL,
            `stage`           varchar(500) NOT NULL DEFAULT 'lead',
            `notes`           varchar(500) NULL,
            `tags`            json         NOT NULL,
            `created_at`      datetime(6)  NOT NULL,
            `last_contact_at` datetime(6)  NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `events` (
            `id`          varchar(255)   NOT NULL,
            `org_id`      varchar(255)   NOT NULL,
            `client_id`   varchar(255)   NOT NULL DEFAULT '',
            `name`        varchar(500)   NOT NULL,
            `type`        varchar(500)   NOT NULL,
            `status`      varchar(500)   NOT NULL DEFAULT 'lead',
            `venue`       varchar(500)   NULL,
            `notes`       varchar(500)   NULL,
            `budget`      decimal(65,30) NOT NULL,
            `guest_count` int            NOT NULL,
            `event_date`  datetime(6)    NOT NULL,
            `created_at`  datetime(6)    NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `vendors` (
            `id`         varchar(255)   NOT NULL,
            `org_id`     varchar(255)   NOT NULL,
            `name`       varchar(500)   NOT NULL,
            `category`   varchar(500)   NOT NULL,
            `email`      varchar(500)   NULL,
            `phone`      varchar(500)   NULL,
            `website`    varchar(500)   NULL,
            `notes`      varchar(500)   NULL,
            `rating`     decimal(65,30) NOT NULL DEFAULT 0,
            `is_active`  tinyint(1)     NOT NULL DEFAULT 1,
            `created_at` datetime(6)    NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `sales` (
            `id`          varchar(255)   NOT NULL,
            `org_id`      varchar(255)   NOT NULL,
            `event_id`    varchar(255)   NULL,
            `client_id`   varchar(255)   NOT NULL,
            `type`        varchar(500)   NOT NULL DEFAULT 'quote',
            `status`      varchar(500)   NOT NULL DEFAULT 'draft',
            `subtotal`    decimal(65,30) NOT NULL,
            `tax`         decimal(65,30) NOT NULL,
            `total`       decimal(65,30) NOT NULL,
            `paid_amount` decimal(65,30) NOT NULL,
            `notes`       varchar(500)   NULL,
            `created_at`  datetime(6)    NOT NULL,
            `sent_at`     datetime(6)    NULL,
            `paid_at`     datetime(6)    NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `sale_items` (
            `id`          varchar(255)   NOT NULL,
            `sale_id`     varchar(255)   NOT NULL,
            `description` varchar(500)   NOT NULL,
            `quantity`    int            NOT NULL DEFAULT 1,
            `unit_price`  decimal(65,30) NOT NULL,
            `total`       decimal(65,30) NOT NULL,
            `sort_order`  int            NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `whatsapp_chats` (
            `id`              varchar(255) NOT NULL,
            `org_id`          varchar(255) NOT NULL,
            `client_id`       varchar(255) NULL,
            `phone`           varchar(500) NOT NULL,
            `contact_name`    varchar(500) NULL,
            `status`          varchar(500) NOT NULL DEFAULT 'open',
            `last_message_at` datetime(6)  NULL,
            `created_at`      datetime(6)  NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
            `id`        varchar(255) NOT NULL,
            `chat_id`   varchar(255) NOT NULL,
            `org_id`    varchar(255) NOT NULL,
            `direction` varchar(500) NOT NULL DEFAULT 'inbound',
            `body`      longtext     NOT NULL,
            `media_url` varchar(500) NULL,
            `status`    varchar(500) NOT NULL DEFAULT 'received',
            `sent_at`   datetime(6)  NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `contracts` (
            `id`         varchar(255)   NOT NULL,
            `org_id`     varchar(255)   NOT NULL,
            `client_id`  varchar(255)   NOT NULL,
            `event_id`   varchar(255)   NULL,
            `template`   varchar(500)   NOT NULL DEFAULT 'general',
            `status`     varchar(500)   NOT NULL DEFAULT 'draft',
            `title`      varchar(500)   NOT NULL,
            `total`      decimal(65,30) NOT NULL,
            `notes`      longtext       NULL,
            `created_at` datetime(6)    NOT NULL,
            `sent_at`    datetime(6)    NULL,
            `signed_at`  datetime(6)    NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `leads` (
            `id`              varchar(255)   NOT NULL,
            `org_id`          varchar(255)   NOT NULL,
            `client_id`       varchar(255)   NULL,
            `name`            varchar(500)   NOT NULL,
            `phone`           varchar(500)   NOT NULL,
            `event_type`      varchar(500)   NULL,
            `event_date`      varchar(500)   NULL,
            `budget`          decimal(65,30) NULL,
            `stage`           varchar(500)   NOT NULL DEFAULT 'nuevo',
            `last_message`    varchar(500)   NULL,
            `unread_count`    int            NOT NULL DEFAULT 0,
            `created_at`      datetime(6)    NOT NULL,
            `last_message_at` datetime(6)    NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `lead_messages` (
            `id`         varchar(255) NOT NULL,
            `lead_id`    varchar(255) NOT NULL,
            `org_id`     varchar(255) NOT NULL,
            `body`       longtext     NOT NULL,
            `direction`  varchar(500) NOT NULL DEFAULT 'inbound',
            `media_url`  varchar(500) NULL,
            `media_type` varchar(100) NULL,
            `sent_at`    datetime(6)  NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `event_payments` (
            `id`         varchar(255)   NOT NULL,
            `org_id`     varchar(255)   NOT NULL,
            `event_id`   varchar(255)   NOT NULL,
            `concept`    varchar(500)   NOT NULL,
            `amount`     decimal(65,30) NOT NULL,
            `method`     varchar(500)   NOT NULL DEFAULT 'transfer',
            `paid_at`    datetime(6)    NOT NULL,
            `created_at` datetime(6)    NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        // ── Pomelo 8.x GUID fix: ensure all ID/FK columns are varchar(255) ──
        // Pomelo maps char(36) → DbType.Guid → reader.GetGuid() → cast error.
        // Columns created by older EnsureCreatedAsync calls may still be char(36).
        "ALTER TABLE organizations MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE users         MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE users         MODIFY COLUMN org_id     varchar(255) NOT NULL",
        "ALTER TABLE clients       MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE clients       MODIFY COLUMN org_id     varchar(255) NOT NULL",
        "ALTER TABLE events        MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE events        MODIFY COLUMN org_id     varchar(255) NOT NULL",
        "ALTER TABLE events        MODIFY COLUMN client_id  varchar(255) NOT NULL DEFAULT ''",
        "ALTER TABLE vendors       MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE vendors       MODIFY COLUMN org_id     varchar(255) NOT NULL",
        "ALTER TABLE sales         MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE sales         MODIFY COLUMN org_id     varchar(255) NOT NULL",
        "ALTER TABLE sales         MODIFY COLUMN client_id  varchar(255) NOT NULL",
        "ALTER TABLE sales         MODIFY COLUMN event_id   varchar(255) NULL",
        "ALTER TABLE sale_items    MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE sale_items    MODIFY COLUMN sale_id    varchar(255) NOT NULL",
        "ALTER TABLE whatsapp_chats    MODIFY COLUMN id     varchar(255) NOT NULL",
        "ALTER TABLE whatsapp_chats    MODIFY COLUMN org_id varchar(255) NOT NULL",
        "ALTER TABLE whatsapp_messages MODIFY COLUMN id     varchar(255) NOT NULL",
        "ALTER TABLE whatsapp_messages MODIFY COLUMN chat_id varchar(255) NOT NULL",
        "ALTER TABLE whatsapp_messages MODIFY COLUMN org_id varchar(255) NOT NULL",
        "ALTER TABLE contracts     MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE contracts     MODIFY COLUMN org_id     varchar(255) NOT NULL",
        "ALTER TABLE contracts     MODIFY COLUMN client_id  varchar(255) NOT NULL",
        "ALTER TABLE contracts     MODIFY COLUMN event_id   varchar(255) NULL",
        "ALTER TABLE leads         MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE leads         MODIFY COLUMN org_id     varchar(255) NOT NULL",
        "ALTER TABLE lead_messages MODIFY COLUMN id         varchar(255) NOT NULL",
        "ALTER TABLE lead_messages MODIFY COLUMN lead_id    varchar(255) NOT NULL",
        "ALTER TABLE lead_messages MODIFY COLUMN org_id     varchar(255) NOT NULL",
        "ALTER TABLE event_payments MODIFY COLUMN id        varchar(255) NOT NULL",
        "ALTER TABLE event_payments MODIFY COLUMN org_id    varchar(255) NOT NULL",
        "ALTER TABLE event_payments MODIFY COLUMN event_id  varchar(255) NOT NULL",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar(500) NULL",
        "ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS media_url  varchar(500) NULL",
        "ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS media_type varchar(100) NULL",
    };

    try
    {
        await db.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 0");
        foreach (var sql in startupSql)
        {
            try { await db.Database.ExecuteSqlRawAsync(sql); }
            catch { /* table/column already exists or other non-fatal error — skip */ }
        }
    }
    finally
    {
        try { await db.Database.ExecuteSqlRawAsync("SET FOREIGN_KEY_CHECKS = 1"); }
        catch { }
    }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "DB startup error — app will continue without schema init");
}

// CORS must be first — ensures Access-Control-Allow-Origin appears even on error responses
app.UseCors();

app.UseSwagger();
app.UseSwaggerUI();

// Global exception handler — returns JSON and preserves CORS headers
app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
{
    ctx.Response.StatusCode = 500;
    ctx.Response.ContentType = "application/json";
    var feature = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
    var msg = feature?.Error?.Message ?? "Internal server error";
    await ctx.Response.WriteAsync($"{{\"error\":\"{msg}\"}}");
}));

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
