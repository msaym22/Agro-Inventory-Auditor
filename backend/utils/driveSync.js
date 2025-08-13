// backend/utils/driveSync.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

// IMPORTANT: This must point to the exact DB file used by Sequelize
// Our Sequelize config stores SQLite at backend/database.sqlite
const DB_PATH = path.resolve(__dirname, '../database.sqlite');
const CONFIG_DIR = path.resolve(__dirname, '../config');
const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');
const CREDENTIALS_PATH = path.join(CONFIG_DIR, 'google-credentials.json');
const STATUS_PATH = path.join(CONFIG_DIR, 'drive-sync.json');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeJsonSafe(filePath, data) {
  try {
    ensureConfigDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

function extractCredentials(credentials) {
  // Support either { installed: {...} } or { web: {...} }
  if (!credentials) throw new Error('Missing Google credentials');
  const c = credentials.installed || credentials.web;
  if (!c) throw new Error('Invalid Google credentials format (expected installed or web)');
  const { client_secret, client_id, redirect_uris } = c;
  if (!client_id || !client_secret || !redirect_uris || !redirect_uris[0]) {
    throw new Error('Google credentials missing client_id/client_secret/redirect_uris');
  }
  return { client_secret, client_id, redirect_uri: redirect_uris[0] };
}

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

async function authorize(credentials) {
  const cred = extractCredentials(credentials);
  const oAuth2Client = new google.auth.OAuth2(
    cred.client_id, cred.client_secret, cred.redirect_uri
  );

  const token = readJsonSafe(TOKEN_PATH);
  if (token) {
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }
  return null;
}

async function downloadDatabase(auth) {
  const drive = google.drive({ version: 'v3', auth });

  // Try preferred name first; fall back to any .sqlite file, newest first
  let filesRes = await drive.files.list({
    q: "name='almadina-agro-db.sqlite'",
    fields: 'files(id, name, modifiedTime)',
    orderBy: 'modifiedTime desc'
  });

  if (!filesRes.data.files || filesRes.data.files.length === 0) {
    filesRes = await drive.files.list({
      q: "name contains '.sqlite'",
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });
  }

  if (!filesRes.data.files || filesRes.data.files.length === 0) {
    console.log('No database file found in Drive');
    return false;
  }

  const fileId = filesRes.data.files[0].id;
  await new Promise((resolve) => {
    const dest = fs.createWriteStream(DB_PATH);
    drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
      .then(response => {
        response.data
          .on('end', () => resolve(true))
          .on('error', err => {
            console.error('Error downloading database', err);
            resolve(false);
          })
          .pipe(dest);
      })
      .catch(err => {
        console.error('Error downloading file', err);
        resolve(false);
      });
  });
  return true;
}

async function uploadDatabase(auth) {
  const drive = google.drive({ version: 'v3', auth });

  // Prefer updating existing preferred-name file; otherwise create one
  let res = await drive.files.list({
    q: "name='almadina-agro-db.sqlite'",
    fields: 'files(id, name)'
  });

  const fileMetadata = { name: 'almadina-agro-db.sqlite' };
  const media = { mimeType: 'application/x-sqlite3', body: fs.createReadStream(DB_PATH) };

  if (res.data.files && res.data.files.length > 0) {
    await drive.files.update({ fileId: res.data.files[0].id, media });
    console.log('Database updated on Drive');
  } else {
    await drive.files.create({ resource: fileMetadata, media, fields: 'id' });
    console.log('Database uploaded to Drive');
  }
  return true;
}

// Explicit operations
async function pullDatabase() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return { success: false, reason: 'no-credentials' };
    }
    const credentials = readJsonSafe(CREDENTIALS_PATH);
    const auth = await authorize(credentials);
    if (!auth) return { success: false, reason: 'not-authenticated' };
    const ok = await downloadDatabase(auth);
    if (!ok) return { success: false };
    const finalHash = computeFileHash(DB_PATH);
    const nowIso = new Date().toISOString();
    saveStatus({ lastSync: nowIso, lastHash: finalHash });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function pushDatabase() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return { success: false, reason: 'no-credentials' };
    }
    const credentials = readJsonSafe(CREDENTIALS_PATH);
    const auth = await authorize(credentials);
    if (!auth) return { success: false, reason: 'not-authenticated' };
    await uploadDatabase(auth);
    const finalHash = computeFileHash(DB_PATH);
    const nowIso = new Date().toISOString();
    saveStatus({ lastSync: nowIso, lastHash: finalHash });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getStatus() {
  const status = readJsonSafe(STATUS_PATH) || { lastSync: null, lastHash: null, isAuthenticated: false };
  const tokenExists = !!readJsonSafe(TOKEN_PATH);
  status.isAuthenticated = tokenExists;
  return status;
}

function saveStatus(partial) {
  const existing = getStatus();
  const updated = { ...existing, ...partial };
  writeJsonSafe(STATUS_PATH, updated);
  return updated;
}

async function syncDatabase({ force = false } = {}) {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.log('Google Drive credentials not found');
      return { success: false, reason: 'no-credentials' };
    }
    const credentials = readJsonSafe(CREDENTIALS_PATH);
    const auth = await authorize(credentials);
    if (!auth) {
      console.log('Google Drive not authenticated');
      return { success: false, reason: 'not-authenticated' };
    }

    const currentHash = computeFileHash(DB_PATH);
    const { lastHash } = getStatus();
    if (!force && currentHash && lastHash && currentHash === lastHash) {
      console.log('No database changes detected; skipping upload');
      return { success: true, skipped: true };
    }

    // Optional: download first to pull remote changes
    await downloadDatabase(auth);

    // Upload latest local DB
    await uploadDatabase(auth);

    const finalHash = computeFileHash(DB_PATH);
    const nowIso = new Date().toISOString();
    saveStatus({ lastSync: nowIso, lastHash: finalHash });

    return { success: true };
  } catch (error) {
    console.error('Google Drive sync error:', error);
    return { success: false, error: error.message };
  }
}

function scheduleDailySync() {
  // Schedule first run at next 00:00 local time, then every 24h
  function msUntilNextMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
  }
  const scheduleOnce = () => {
    setTimeout(async () => {
      try { await syncDatabase({ force: false }); } catch (e) {}
      scheduleOnce();
    }, msUntilNextMidnight());
  };
  scheduleOnce();
}

async function getAuthUrl() {
  const credentials = readJsonSafe(CREDENTIALS_PATH);
  const cred = extractCredentials(credentials);
  const oAuth2Client = new google.auth.OAuth2(
    cred.client_id, cred.client_secret, cred.redirect_uri
  );
  return oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
}

async function storeToken(code) {
  const credentials = readJsonSafe(CREDENTIALS_PATH);
  const cred = extractCredentials(credentials);
  const oAuth2Client = new google.auth.OAuth2(
    cred.client_id, cred.client_secret, cred.redirect_uri
  );
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  writeJsonSafe(TOKEN_PATH, tokens);
  saveStatus({ isAuthenticated: true });
  return tokens;
}

module.exports = {
  authorize,
  syncDatabase,
  getAuthUrl,
  storeToken,
  getStatus,
  scheduleDailySync,
  pullDatabase,
  pushDatabase,
};