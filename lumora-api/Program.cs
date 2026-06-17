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
    ?? "https://lumora-wa-production.up.railway.app";
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
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IStripeService, StripeService>();

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
            opts.MapInboundClaims = false; // keep claim names as-is ("role", "email", etc.)
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
                    || uri.Host == "127.0.0.1"
                    || uri.Host == "elixe.mx"
                    || uri.Host == "www.elixe.mx";
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

        @"CREATE TABLE IF NOT EXISTS `event_photos` (
            `id`         varchar(255) NOT NULL,
            `event_id`   varchar(255) NOT NULL,
            `org_id`     varchar(255) NOT NULL,
            `url`        varchar(500) NOT NULL,
            `caption`    varchar(500) NULL,
            `created_at` datetime(6)  NOT NULL,
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

        @"CREATE TABLE IF NOT EXISTS `org_tasks` (
            `id`         varchar(255) NOT NULL,
            `org_id`     varchar(255) NOT NULL,
            `text`       varchar(500) NOT NULL,
            `completed`  tinyint(1)   NOT NULL DEFAULT 0,
            `created_at` datetime(6)  NOT NULL,
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
        "ALTER TABLE event_photos   MODIFY COLUMN id        varchar(255) NOT NULL",
        "ALTER TABLE event_photos   MODIFY COLUMN org_id    varchar(255) NOT NULL",
        "ALTER TABLE event_photos   MODIFY COLUMN event_id  varchar(255) NOT NULL",
        "ALTER TABLE users         ADD COLUMN password_hash varchar(500) NULL",
        "ALTER TABLE lead_messages ADD COLUMN media_url    varchar(500) NULL",
        "ALTER TABLE lead_messages ADD COLUMN media_type   varchar(100) NULL",
        "ALTER TABLE users ADD COLUMN profile_photo varchar(500) NULL",
        "ALTER TABLE users ADD COLUMN phone varchar(50) NULL",
        "ALTER TABLE organizations ADD COLUMN stripe_customer_id varchar(255) NULL",
        "ALTER TABLE organizations ADD COLUMN stripe_subscription_id varchar(255) NULL",

        @"CREATE TABLE IF NOT EXISTS `org_products` (
            `id`          varchar(255) NOT NULL,
            `org_id`      varchar(255) NOT NULL,
            `name`        varchar(500) NOT NULL,
            `description` varchar(1000) NULL,
            `price`       decimal(18,2) NOT NULL DEFAULT 0,
            `unit`        varchar(100) NOT NULL DEFAULT 'pieza',
            `category`    varchar(100) NOT NULL DEFAULT 'servicio',
            `active`      tinyint(1) NOT NULL DEFAULT 1,
            `created_at`  datetime(6) NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `event_products` (
            `id`          varchar(255) NOT NULL,
            `event_id`    varchar(255) NOT NULL,
            `org_id`      varchar(255) NOT NULL,
            `product_id`  varchar(255) NULL,
            `name`        varchar(500) NOT NULL,
            `description` varchar(1000) NULL,
            `qty`         int NOT NULL DEFAULT 1,
            `unit_price`  decimal(18,2) NOT NULL DEFAULT 0,
            `notes`       varchar(1000) NULL,
            `created_at`  datetime(6) NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `promo_codes` (
            `id`          varchar(255) NOT NULL,
            `code`        varchar(100) NOT NULL,
            `plan_id`     varchar(100) NOT NULL DEFAULT 'negocio',
            `description` varchar(500) NULL,
            `max_uses`    int NOT NULL DEFAULT -1,
            `used_count`  int NOT NULL DEFAULT 0,
            `expires_at`  datetime(6) NULL,
            `active`      tinyint(1) NOT NULL DEFAULT 1,
            `created_at`  datetime(6) NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uq_promo_code` (`code`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `pipeline_stages` (
            `id`         varchar(255) NOT NULL,
            `org_id`     varchar(255) NOT NULL,
            `label`      varchar(500) NOT NULL,
            `color`      varchar(50)  NOT NULL DEFAULT '#64748b',
            `sort_order` int          NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `quick_replies` (
            `id`         varchar(255) NOT NULL,
            `org_id`     varchar(255) NOT NULL,
            `title`      varchar(500) NOT NULL,
            `body`       longtext     NOT NULL,
            `created_at` datetime(6)  NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `org_plan_history` (
            `id`           varchar(255)  NOT NULL,
            `org_id`       varchar(255)  NOT NULL,
            `plan_id`      varchar(100)  NOT NULL,
            `method`       varchar(100)  NOT NULL DEFAULT 'stripe',
            `promo_code`   varchar(100)  NULL,
            `amount`       decimal(10,2) NOT NULL DEFAULT 0,
            `activated_at` datetime(6)   NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `org_settings` (
            `org_id`        varchar(255)  NOT NULL,
            `company_name`  varchar(500)  NOT NULL DEFAULT '',
            `rfc`           varchar(100)  NOT NULL DEFAULT '',
            `director_name` varchar(500)  NOT NULL DEFAULT '',
            `phone`         varchar(100)  NOT NULL DEFAULT '',
            `email`         varchar(500)  NOT NULL DEFAULT '',
            `city`          varchar(500)  NOT NULL DEFAULT '',
            `address`       varchar(500)  NOT NULL DEFAULT '',
            PRIMARY KEY (`org_id`)
        ) CHARACTER SET utf8mb4",

        // Add discount_pct column — throws "Duplicate column" if already exists, catch swallows it
        "ALTER TABLE `promo_codes` ADD COLUMN `discount_pct` int NOT NULL DEFAULT 100",

        // Seed default promo codes (INSERT IGNORE = no-op if code already exists)
        "INSERT IGNORE INTO `promo_codes` (`id`,`code`,`plan_id`,`description`,`max_uses`,`used_count`,`active`,`created_at`) VALUES ('promo_elixe2026','ELIXE2026','negocio','Acceso gratis Plan Negocio',-1,0,1,NOW())",
        "INSERT IGNORE INTO `promo_codes` (`id`,`code`,`plan_id`,`description`,`max_uses`,`used_count`,`active`,`created_at`) VALUES ('promo_agencia','AGENCIA2026','agencia','Acceso gratis Plan Agencia',-1,0,1,NOW())",

        // Plan configs table
        @"CREATE TABLE IF NOT EXISTS `plan_configs` (
            `id`          varchar(255) NOT NULL,
            `plan_id`     varchar(50)  NOT NULL,
            `name`        varchar(100) NOT NULL,
            `price`       int          NOT NULL DEFAULT 0,
            `description` varchar(500) NOT NULL DEFAULT '',
            `color`       varchar(20)  NOT NULL DEFAULT '#7c6af7',
            `popular`     tinyint(1)   NOT NULL DEFAULT 0,
            `features`    json         NOT NULL,
            `sort_order`  int          NOT NULL DEFAULT 0,
            `updated_at`  datetime(6)  NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uq_plan_config_plan_id` (`plan_id`)
        ) CHARACTER SET utf8mb4",

        // Fix corrupted Solo features (PascalCase bug or bad user input — always restore clean data)
        @"UPDATE `plan_configs` SET `features` = '[{""text"":""1 usuario"",""ok"":true},{""text"":""20 eventos activos"",""ok"":true},{""text"":""200 clientes"",""ok"":true},{""text"":""Calendario y tareas"",""ok"":true},{""text"":""Catálogo de productos"",""ok"":true},{""text"":""Directorio de proveedores"",""ok"":true},{""text"":""Cotizaciones (hasta 15/mes)"",""ok"":true},{""text"":""Contratos básicos"",""ok"":true},{""text"":""Historial de pagos"",""ok"":true},{""text"":""2 GB almacenamiento"",""ok"":true},{""text"":""WhatsApp CRM"",""ok"":false},{""text"":""Pipeline de ventas"",""ok"":false},{""text"":""Reportes y estadísticas"",""ok"":false}]' WHERE `plan_id` = 'solo' AND (features LIKE '%""Text""%' OR features LIKE '%adwa%')",

        // Seed the 3 plans (INSERT IGNORE = no-op if already exists)
        @"INSERT IGNORE INTO `plan_configs` (`id`,`plan_id`,`name`,`price`,`description`,`color`,`popular`,`features`,`sort_order`,`updated_at`) VALUES (
            'plan_solo','solo','Solo',399,
            'Para fotógrafos, DJs, decoradores y coordinadores que trabajan solos.',
            '#2B6FD4',0,
            '[{""text"":""1 usuario"",""ok"":true},{""text"":""20 eventos activos"",""ok"":true},{""text"":""200 clientes"",""ok"":true},{""text"":""Calendario y tareas"",""ok"":true},{""text"":""Catálogo de productos"",""ok"":true},{""text"":""Directorio de proveedores"",""ok"":true},{""text"":""Cotizaciones (hasta 15/mes)"",""ok"":true},{""text"":""Contratos básicos"",""ok"":true},{""text"":""Historial de pagos"",""ok"":true},{""text"":""2 GB almacenamiento"",""ok"":true},{""text"":""WhatsApp CRM"",""ok"":false},{""text"":""Pipeline de ventas"",""ok"":false},{""text"":""Reportes y estadísticas"",""ok"":false}]',
            1, NOW())",

        @"INSERT INTO `plan_configs` (`id`,`plan_id`,`name`,`price`,`description`,`color`,`popular`,`features`,`sort_order`,`updated_at`) VALUES (
            'plan_negocio','negocio','Negocio',799,
            'Para negocios establecidos: wedding planners, salones y coordinadoras con equipo.',
            '#C9A255',1,
            '[{""text"":""Hasta 3 usuarios"",""ok"":true},{""text"":""Eventos ilimitados"",""ok"":true},{""text"":""Clientes ilimitados"",""ok"":true},{""text"":""Todo lo del plan Solo"",""ok"":true},{""text"":""WhatsApp CRM"",""ok"":true},{""text"":""Cotizaciones ilimitadas + PDF"",""ok"":true},{""text"":""Contratos con firma digital"",""ok"":true},{""text"":""Pipeline de ventas (Kanban)"",""ok"":true},{""text"":""Reportes e ingresos"",""ok"":true},{""text"":""Exportar datos Excel/PDF"",""ok"":true},{""text"":""10 GB almacenamiento"",""ok"":true},{""text"":""Soporte prioritario (24h)"",""ok"":true}]',
            2, NOW())
            ON DUPLICATE KEY UPDATE `sort_order` = 2",

        @"INSERT INTO `plan_configs` (`id`,`plan_id`,`name`,`price`,`description`,`color`,`popular`,`features`,`sort_order`,`updated_at`) VALUES (
            'plan_agencia','agencia','Agencia',1499,
            'Para agencias de eventos, salones grandes y equipos de 5 o más personas.',
            '#7c6af7',0,
            '[{""text"":""Hasta 10 usuarios"",""ok"":true},{""text"":""Todo ilimitado"",""ok"":true},{""text"":""Todo lo del plan Negocio"",""ok"":true},{""text"":""Roles y permisos por usuario"",""ok"":true},{""text"":""Reportes avanzados"",""ok"":true},{""text"":""Importación masiva (CSV)"",""ok"":true},{""text"":""API de integración"",""ok"":true},{""text"":""Plantillas personalizadas"",""ok"":true},{""text"":""50 GB almacenamiento"",""ok"":true},{""text"":""Onboarding dedicado"",""ok"":true},{""text"":""Soporte 24/7 por WhatsApp"",""ok"":true}]',
            3, NOW())
            ON DUPLICATE KEY UPDATE `sort_order` = 3",

        // Support tickets table
        @"CREATE TABLE IF NOT EXISTS `support_tickets` (
            `id`         varchar(255) NOT NULL,
            `org_id`     varchar(255) NULL,
            `org_name`   varchar(500) NOT NULL DEFAULT '',
            `user_name`  varchar(500) NOT NULL DEFAULT '',
            `user_email` varchar(500) NOT NULL DEFAULT '',
            `type`       varchar(50)  NOT NULL DEFAULT 'duda',
            `message`    longtext     NOT NULL,
            `photo_url`  varchar(500) NULL,
            `status`     varchar(50)  NOT NULL DEFAULT 'open',
            `created_at` datetime(6)  NOT NULL,
            PRIMARY KEY (`id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `support_messages` (
            `id`          varchar(255) NOT NULL,
            `ticket_id`   varchar(255) NOT NULL,
            `author_role` varchar(50)  NOT NULL DEFAULT 'user',
            `author_name` varchar(500) NOT NULL DEFAULT '',
            `message`     longtext     NOT NULL,
            `created_at`  datetime(6)  NOT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_support_messages_ticket` (`ticket_id`)
        ) CHARACTER SET utf8mb4",

        // Superadmin table
        @"CREATE TABLE IF NOT EXISTS `superadmins` (
            `id`            varchar(255) NOT NULL,
            `email`         varchar(255) NOT NULL,
            `password_hash` varchar(500) NOT NULL,
            `created_at`    datetime(6)  NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uq_superadmin_email` (`email`)
        ) CHARACTER SET utf8mb4",

        // Notas compartidas
        @"CREATE TABLE IF NOT EXISTS `shared_notes` (
            `id`         varchar(255) NOT NULL,
            `org_id`     varchar(255) NOT NULL,
            `user_id`    varchar(255) NOT NULL,
            `user_name`  varchar(255) NOT NULL,
            `user_photo` varchar(500)  NULL,
            `content`    longtext     NOT NULL,
            `color`      varchar(50)  NOT NULL DEFAULT 'yellow',
            `created_at` datetime(6)  NOT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_shared_notes_org` (`org_id`)
        ) CHARACTER SET utf8mb4",

        @"CREATE TABLE IF NOT EXISTS `note_reactions` (
            `id`         varchar(255) NOT NULL,
            `note_id`    varchar(255) NOT NULL,
            `user_id`    varchar(255) NOT NULL,
            `user_name`  varchar(255) NOT NULL,
            `emoji`      varchar(20)  NOT NULL,
            `created_at` datetime(6)  NOT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uq_note_reaction` (`note_id`, `user_id`, `emoji`),
            KEY `idx_note_reactions_note` (`note_id`)
        ) CHARACTER SET utf8mb4",
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

    // Seed superadmin account if it doesn't exist yet
    try
    {
        var saEmail = "jaimes.angel.jtv@gmail.com";
        var exists = await db.SuperAdmins.AnyAsync(s => s.Email == saEmail);
        if (!exists)
        {
            var saltBytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(16);
            var hashBytes = System.Security.Cryptography.Rfc2898DeriveBytes.Pbkdf2(
                System.Text.Encoding.UTF8.GetBytes("Angel122"),
                saltBytes, 100000,
                System.Security.Cryptography.HashAlgorithmName.SHA256, 32);
            var hash = $"{Convert.ToBase64String(saltBytes)}:{Convert.ToBase64String(hashBytes)}";
            db.SuperAdmins.Add(new lumora_api.Models.SuperAdminUser
            {
                Id           = Guid.NewGuid().ToString(),
                Email        = saEmail,
                PasswordHash = hash,
                CreatedAt    = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }
    }
    catch { }
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

// R2 diagnostics — hit this URL to see if R2 uploads are working
app.MapGet("/api/r2/test", async (IR2Service r2) =>
{
    var (ok, detail) = await r2.TestAsync();
    return Results.Ok(new { ok, detail });
});

app.Run();
