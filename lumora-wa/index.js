/**
 * Lumora WA Server
 * Multi-client WhatsApp bridge with full media support.
 * Sends webhooks to the Lumora API for every inbound/outbound message.
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  getContentType,
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const pino   = require('pino');
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const logger = pino({ level: 'silent' });
// Compatible with existing Railway variable LUMORA_WEBHOOK_URL
// or constructs from LUMORA_API_URL
const LUMORA_WEBHOOK_URL =
  process.env.LUMORA_WEBHOOK_URL ??
  `${process.env.LUMORA_API_URL ?? 'https://lumora-api-production.up.railway.app'}/api/whatsapp/webhook`;

// ── Client registry ──────────────────────────────────────────────────────────
// Map<clientName, { sock, status, qrCode, phone, sentIds, webhookUrl }>
const clients = new Map();

function sessionDir(name) {
  return path.join('sessions', name.replace(/[^a-z0-9_-]/gi, '_'));
}

// ── Connect ──────────────────────────────────────────────────────────────────
async function connectClient(name, webhookUrl) {
  if (clients.get(name)?.sock) return; // already connecting/connected

  const entry = clients.get(name) ?? { sock: null, status: 'disconnected', qrCode: null, phone: null, sentIds: new Set(), webhookUrl: webhookUrl ?? LUMORA_WEBHOOK_URL };
  if (webhookUrl) entry.webhookUrl = webhookUrl;
  clients.set(name, entry);
  entry.status = 'loading';

  const dir = sessionDir(name);
  fs.mkdirSync(dir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(dir);

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
    getMessage: async () => undefined,
  });

  entry.sock = sock;
  sock.ev.on('creds.update', saveCreds);

  // ── Incoming / outgoing messages ──────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      const jid = msg.key.remoteJid ?? '';
      if (!jid || jid.endsWith('@g.us')) continue; // skip groups

      const fromMe = !!msg.key.fromMe;

      // Skip messages this server just sent to avoid loops
      if (fromMe && entry.sentIds.has(msg.key.id)) {
        entry.sentIds.delete(msg.key.id);
        continue;
      }

      const direction = fromMe ? 'outbound' : 'inbound';
      const phone     = jid.replace(/@\S+/, '');
      const msgBody   = msg.message;
      if (!msgBody) continue;

      const ctype = getContentType(msgBody);

      // Text body (caption for media messages)
      const body =
        msgBody.conversation ??
        msgBody.extendedTextMessage?.text ??
        msgBody.imageMessage?.caption ??
        msgBody.videoMessage?.caption ??
        msgBody.documentMessage?.caption ??
        '';

      // Media download
      let mediaData     = null;
      let mediaType     = null;
      let mediaFilename = null;

      const mediaTypes = ['imageMessage', 'audioMessage', 'videoMessage', 'documentMessage', 'stickerMessage'];
      if (mediaTypes.includes(ctype)) {
        try {
          const buf = await downloadMediaMessage(msg, 'buffer', {});
          mediaData = buf.toString('base64');

          if (ctype === 'imageMessage') {
            mediaType     = msgBody.imageMessage?.mimetype ?? 'image/jpeg';
            mediaFilename = `image_${msg.key.id}.jpg`;
          } else if (ctype === 'audioMessage') {
            mediaType     = msgBody.audioMessage?.mimetype ?? 'audio/ogg; codecs=opus';
            mediaFilename = `audio_${msg.key.id}.ogg`;
          } else if (ctype === 'videoMessage') {
            mediaType     = msgBody.videoMessage?.mimetype ?? 'video/mp4';
            mediaFilename = `video_${msg.key.id}.mp4`;
          } else if (ctype === 'documentMessage') {
            mediaType     = msgBody.documentMessage?.mimetype ?? 'application/octet-stream';
            mediaFilename = msgBody.documentMessage?.fileName ?? `doc_${msg.key.id}`;
          } else if (ctype === 'stickerMessage') {
            mediaType     = msgBody.stickerMessage?.mimetype ?? 'image/webp';
            mediaFilename = `sticker_${msg.key.id}.webp`;
          }
        } catch (err) {
          console.error(`[WA:${name}] media download failed:`, err.message);
        }
      }

      // Skip if no content at all
      if (!body && !mediaData) continue;

      // Post webhook to the client's registered webhook URL
      postWebhook(entry.webhookUrl, {
        clientName: name,
        from:       jid,
        body:       body || '',
        timestamp:  Number(msg.messageTimestamp ?? 0),
        pushname:   msg.pushName ?? null,
        number:     phone,
        direction,
        mediaData,
        mediaType,
        mediaFilename,
      });
    }
  });

  // ── Connection state ──────────────────────────────────────────────────────
  sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
    if (qr) {
      try {
        entry.qrCode = await QRCode.toDataURL(qr);
      } catch {
        entry.qrCode = null;
      }
      entry.status = 'qr';
      console.log(`[WA:${name}] QR ready`);
    }

    if (connection === 'open') {
      entry.status = 'ready';
      entry.qrCode = null;
      const rawId  = sock.user?.id ?? '';
      const digits = rawId.split(':')[0].replace(/\D/g, '');
      entry.phone  = digits ? `+${digits}` : 'connected';
      console.log(`[WA:${name}] Connected (${entry.phone})`);
    }

    if (connection === 'close') {
      const code      = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`[WA:${name}] Disconnected (code ${code})`);

      entry.sock   = null;
      entry.status = 'disconnected';
      entry.qrCode = null;

      if (!loggedOut) {
        console.log(`[WA:${name}] Reconnecting in 5s…`);
        setTimeout(() => connectClient(name), 5000);
      } else {
        clients.delete(name);
      }
    }
  });
}

// Fire-and-forget webhook — retries once on failure
async function postWebhook(url, payload) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (res.ok) return;
      console.error(`[WA] webhook ${res.status} (attempt ${attempt})`);
    } catch (err) {
      console.error(`[WA] webhook error (attempt ${attempt}):`, err.message);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
  }
}

// ── REST API ─────────────────────────────────────────────────────────────────

// Status — returns all connected clients
app.get('/api/whatsapp/status', (_req, res) => {
  const list = Array.from(clients.entries()).map(([name, e]) => ({
    name,
    state:   e.status,
    qrCode:  e.qrCode ?? null,
    phone:   e.phone  ?? null,
  }));
  res.json({ clients: list });
});

// Connect a new client
app.post('/api/whatsapp/connect', async (req, res) => {
  const { name, webhookUrl } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    await connectClient(name, webhookUrl ?? null);
    res.json({ ok: true });
  } catch (err) {
    console.error('[WA] connect error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Disconnect and clear session
app.post('/api/whatsapp/disconnect', async (req, res) => {
  const { name } = req.body ?? {};
  const entry    = clients.get(name);
  if (!entry) return res.json({ ok: true });

  try { await entry.sock?.logout(); } catch {}

  entry.sock   = null;
  entry.status = 'disconnected';
  entry.qrCode = null;
  clients.delete(name);

  try { fs.rmSync(sessionDir(name), { recursive: true, force: true }); } catch {}

  res.json({ ok: true });
});

// Send message (text or media)
app.post('/api/whatsapp/send', async (req, res) => {
  const { phone, message, clientName, country = 'mx', mediaUrl, mediaType } = req.body ?? {};

  const entry = clients.get(clientName);
  if (!entry || entry.status !== 'ready' || !entry.sock) {
    return res.status(400).json({ error: 'Client not connected' });
  }

  try {
    const jid = buildJid(String(phone ?? '').replace(/\D/g, ''), country);

    let msgId;
    if (mediaUrl) {
      const mime = (mediaType ?? 'image/jpeg').split(';')[0].trim();
      if (mime.startsWith('image')) {
        const sent = await entry.sock.sendMessage(jid, { image: { url: mediaUrl }, caption: message ?? '' });
        msgId = sent?.key?.id;
      } else if (mime.startsWith('audio')) {
        const sent = await entry.sock.sendMessage(jid, { audio: { url: mediaUrl }, mimetype: mime, ptt: false });
        msgId = sent?.key?.id;
      } else {
        const sent = await entry.sock.sendMessage(jid, { document: { url: mediaUrl }, mimetype: mime, caption: message ?? '' });
        msgId = sent?.key?.id;
      }
    } else {
      const sent = await entry.sock.sendMessage(jid, { text: message ?? '' });
      msgId = sent?.key?.id;
    }

    // Track this ID so the messages.upsert event skips it (avoids loop)
    if (msgId) entry.sentIds.add(msgId);

    res.json({ ok: true });
  } catch (err) {
    console.error(`[WA:${clientName}] send error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, clients: clients.size }));

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildJid(digits, country) {
  if (digits.length >= 11) return `${digits}@s.whatsapp.net`;
  const prefix = country === 'us' ? '1' : '52';
  return `${prefix}${digits}@s.whatsapp.net`;
}

// ── Restore existing sessions on startup ──────────────────────────────────────
async function restoreSessions() {
  const sessionsRoot = path.join('.', 'sessions');
  if (!fs.existsSync(sessionsRoot)) return;

  const dirs = fs.readdirSync(sessionsRoot).filter(d => {
    return fs.statSync(path.join(sessionsRoot, d)).isDirectory();
  });

  for (const dir of dirs) {
    // dir is the sanitized clientName (underscores, not hyphens)
    // Restore using the exact dir name as clientName
    const name = dir;
    console.log(`[WA] Restoring session: ${name}`);
    await connectClient(name).catch(err =>
      console.error(`[WA] restore failed for ${name}:`, err.message)
    );
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, async () => {
  console.log(`[WA] Lumora WA Server on port ${PORT}`);
  console.log(`[WA] Forwarding webhooks to: ${LUMORA_WEBHOOK_URL}`);
  await restoreSessions();
});
