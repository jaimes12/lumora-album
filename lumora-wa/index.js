/**
 * Lumora WA Server — whatsapp-web.js based
 * Multi-client bridge. Sends webhooks to Lumora API on every inbound message.
 */

const express  = require('express');
const cors     = require('cors');
const qrcode   = require('qrcode');
const fs       = require('fs');
const path     = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const LUMORA_WEBHOOK_URL = process.env.LUMORA_WEBHOOK_URL ?? null;
const SESSION_BASE       = process.env.SESSION_PATH || __dirname;

// Map<name, { client, status, qrCode, phone, instanceId }>
const clients = new Map();
let globalInstanceCounter = 0;

// ── Logging ───────────────────────────────────────────────────────────────────
const eventLog = [];
function log(name, msg) {
  const entry = { ts: Date.now(), name, msg };
  eventLog.unshift(entry);
  if (eventLog.length > 300) eventLog.pop();
  console.log(`[WA:${name}] ${msg}`);
}

// ── Session path ──────────────────────────────────────────────────────────────
function sessionPath(name) {
  return path.join(SESSION_BASE, `session-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
}

function deleteSession(name) {
  try { fs.rmSync(sessionPath(name), { recursive: true, force: true }); } catch {}
}

function destroyInBackground(client) {
  if (!client) return;
  client.removeAllListeners();
  const t = setTimeout(() => {
    try { client.pupPage?.browser?.().process()?.kill('SIGKILL'); } catch {}
  }, 5000);
  client.destroy().catch(() => {}).finally(() => clearTimeout(t));
}

// ── Webhook ───────────────────────────────────────────────────────────────────
function postWebhook(data) {
  if (!LUMORA_WEBHOOK_URL) return;
  try {
    const payload = JSON.stringify(data);
    const url = new URL(LUMORA_WEBHOOK_URL);
    const lib = url.protocol === 'https:' ? require('https') : require('http');
    const r = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + (url.search || ''),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    });
    r.on('error', () => {});
    r.write(payload);
    r.end();
  } catch {}
}

// ── Phone resolution ──────────────────────────────────────────────────────────
async function resolvePhone(msg) {
  let from = msg.from;
  let pushname = msg.notifyName || '';
  try {
    const contact = await msg.getContact();
    pushname = contact.pushname || contact.name || msg.notifyName || '';
    if (msg.from.endsWith('@lid')) {
      const serialized = contact.id?._serialized || '';
      if (serialized.endsWith('@c.us')) from = serialized;
      else return null;
    }
  } catch {
    if (msg.from.endsWith('@lid')) return null;
  }
  return { from, phoneDigits: from.replace(/@\S+/, ''), pushname };
}

// ── Media download ────────────────────────────────────────────────────────────
const MEDIA_LIMIT   = 5 * 1024 * 1024;
const MEDIA_ALLOWED = ['image/', 'audio/'];

async function getMedia(msg) {
  if (!msg.hasMedia) return {};
  try {
    const media = await msg.downloadMedia();
    if (!media) return {};
    if (!MEDIA_ALLOWED.some(t => (media.mimetype || '').startsWith(t))) return {};
    const buf = Buffer.from(media.data, 'base64');
    if (buf.length > MEDIA_LIMIT) return {};
    return { mediaData: media.data, mediaType: media.mimetype, mediaFilename: media.filename || '' };
  } catch { return {}; }
}

// ── Chrome lock cleanup (prevents "profile in use" crash on restart) ──────────
// LocalAuth with dataPath and no clientId stores Chrome profile at <sessionDir>/session/
// (not .wwebjs_auth — that only appears when dataPath is omitted in LocalAuth)
function clearChromeLocks(sessionDir) {
  const locks = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];
  function cleanDir(dir) {
    for (const f of locks) {
      try { fs.rmSync(path.join(dir, f), { force: true }); } catch {}
    }
  }
  // Clean the sessionDir itself and ALL direct subdirectories recursively
  cleanDir(sessionDir);
  try {
    for (const entry of fs.readdirSync(sessionDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const sub = path.join(sessionDir, entry.name);
      cleanDir(sub);
      // one level deeper (e.g. .wwebjs_auth/session-client/)
      try {
        for (const entry2 of fs.readdirSync(sub, { withFileTypes: true })) {
          if (entry2.isDirectory()) cleanDir(path.join(sub, entry2.name));
        }
      } catch {}
    }
  } catch {}
}

// ── Connect client ────────────────────────────────────────────────────────────
function connectClient(name) {
  if (clients.has(name)) return;

  clearChromeLocks(sessionPath(name));
  globalInstanceCounter++;
  const myInstanceId = globalInstanceCounter;
  const entry = { client: null, status: 'loading', qrCode: null, phone: null, instanceId: myInstanceId };
  clients.set(name, entry);

  const waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath(name) }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas',
        '--no-first-run', '--no-zygote', '--disable-gpu',
        '--disable-extensions', '--disable-sync',
        '--disable-background-networking', '--disable-default-apps',
        '--mute-audio', '--no-default-browser-check',
      ],
    },
  });

  entry.client = waClient;

  const isActive = () => {
    const cur = clients.get(name);
    return cur && cur.instanceId === myInstanceId;
  };

  waClient.on('qr', async (qr) => {
    if (!isActive()) return;
    entry.status = 'qr';
    entry.qrCode = await qrcode.toDataURL(qr).catch(() => null);
    log(name, 'QR ready');
  });

  waClient.on('loading_screen', () => {
    if (!isActive()) return;
    entry.status = 'loading';
    entry.qrCode = null;
  });

  waClient.on('authenticated', () => {
    if (!isActive()) return;
    log(name, 'Authenticated');
    entry.status = 'loading';
    entry.qrCode = null;
  });

  waClient.on('ready', () => {
    if (!isActive()) return;
    entry.status = 'ready';
    entry.qrCode = null;
    entry.phone = waClient.info?.wid?.user ? `+${waClient.info.wid.user}` : 'connected';
    log(name, `Connected (${entry.phone})`);
  });

  waClient.on('disconnected', (reason) => {
    if (!isActive()) return;
    log(name, `Disconnected (${reason})`);
    entry.status = 'disconnected';
    entry.qrCode = null;

    const doLogout = reason === 'LOGOUT';
    setTimeout(() => {
      if (!isActive()) return;
      const old = entry.client;
      globalInstanceCounter++;
      entry.instanceId = globalInstanceCounter;
      clients.delete(name);
      destroyInBackground(old);
      if (doLogout) deleteSession(name);
      connectClient(name);
    }, 8000);
  });

  waClient.on('auth_failure', () => {
    if (!isActive()) return;
    log(name, 'Auth failure — clearing session');
    entry.status = 'disconnected';
    entry.qrCode = null;
    setTimeout(() => {
      if (!isActive()) return;
      const old = entry.client;
      globalInstanceCounter++;
      entry.instanceId = globalInstanceCounter;
      clients.delete(name);
      destroyInBackground(old);
      deleteSession(name);
      connectClient(name);
    }, 8000);
  });

  // ── Inbound messages ───────────────────────────────────────────────────────
  waClient.on('message', async (msg) => {
    if (!isActive()) return;
    if (msg.fromMe) return;
    if (msg.from.endsWith('@g.us')) return;
    if (msg.from === 'status@broadcast' || msg.isStatus) return;

    const resolved = await resolvePhone(msg);
    if (!resolved) return;
    const { from, phoneDigits, pushname } = resolved;
    const media = await getMedia(msg);

    log(name, `↓ ${phoneDigits} "${(msg.body || '[media]').slice(0, 40)}"`);
    postWebhook({ clientName: name, from, number: phoneDigits, pushname, body: msg.body || '', timestamp: msg.timestamp, direction: 'inbound', ...media });
  });

  // ── Outbound messages (sent from phone) ────────────────────────────────────
  waClient.on('message_create', async (msg) => {
    if (!isActive()) return;
    if (!msg.fromMe) return;
    if (msg.to.endsWith('@g.us')) return;
    if (msg.to === 'status@broadcast' || msg.to === msg.from) return;

    const phoneDigits = msg.to.replace(/@\S+/, '');
    let pushname = '';
    try { const c = await msg.getContact(); pushname = c.pushname || c.name || ''; } catch {}
    const media = await getMedia(msg);

    log(name, `↑ ${phoneDigits} "${(msg.body || '[media]').slice(0, 40)}"`);
    postWebhook({ clientName: name, from: msg.to, number: phoneDigits, pushname, body: msg.body || '', timestamp: msg.timestamp, direction: 'outbound', ...media });
  });

  waClient.initialize();
  log(name, 'Initializing...');
}

// ── REST API ──────────────────────────────────────────────────────────────────

app.get('/api/whatsapp/status', (_req, res) => {
  const list = Array.from(clients.entries()).map(([name, e]) => ({
    name,
    state:  e.status,
    qrCode: e.qrCode ?? null,
    phone:  e.phone  ?? null,
  }));
  res.json({ clients: list });
});

app.get('/api/whatsapp/logs', (_req, res) => {
  res.json({ logs: eventLog.slice(0, 100) });
});

app.post('/api/whatsapp/connect', (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  if (!clients.has(name)) connectClient(name);
  res.json({ ok: true });
});

app.post('/api/whatsapp/disconnect', (req, res) => {
  const { name } = req.body ?? {};
  const entry = clients.get(name);
  if (!entry) return res.json({ ok: true });

  globalInstanceCounter++;
  entry.instanceId = globalInstanceCounter;
  const old = entry.client;
  clients.delete(name);
  deleteSession(name);
  destroyInBackground(old);
  res.json({ ok: true });
});

app.post('/api/whatsapp/send', async (req, res) => {
  const { phone, message, clientName, country, mediaUrl, mediaType } = req.body ?? {};

  let entry;
  if (clientName) {
    entry = clients.get(clientName);
    if (!entry) return res.status(404).json({ error: `Client "${clientName}" not found` });
  } else {
    for (const e of clients.values()) {
      if (e.status === 'ready') { entry = e; break; }
    }
  }

  if (!entry || entry.status !== 'ready') {
    return res.status(503).json({ error: 'No client ready' });
  }

  const digits   = String(phone ?? '').replace(/\D/g, '');
  const normalized = digits.length >= 11 ? digits : (country === 'us' ? `1${digits}` : `521${digits}`);
  const chatId   = `${normalized}@c.us`;

  res.json({ ok: true });

  try {
    if (mediaUrl) {
      const { MessageMedia } = require('whatsapp-web.js');
      const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });
      await entry.client.sendMessage(chatId, media, { caption: message || '' });
    } else {
      await entry.client.sendMessage(chatId, message ?? '');
    }
  } catch (err) {
    log(clientName || 'auto', `Send error: ${err.message}`);
  }
});

app.get('/health', (_req, res) => res.json({ ok: true, clients: clients.size }));

// ── Restore sessions on startup ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[WA] Lumora WA Server on port ${PORT}`);
  console.log(`[WA] Webhook: ${LUMORA_WEBHOOK_URL ?? '(not set)'}`);

  try {
    const entries = fs.readdirSync(SESSION_BASE, { withFileTypes: true });
    for (const d of entries) {
      if (d.isDirectory() && d.name.startsWith('session-')) {
        const name = d.name.slice('session-'.length);
        if (name) { connectClient(name); log(name, 'Restored from disk'); }
      }
    }
  } catch {}
});
