// backend/utils/driveSync.js
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.resolve(__dirname, '../../database.sqlite');
const TOKEN_PATH = path.resolve(__dirname, '../config/token.json');
const CREDENTIALS_PATH = path.resolve(__dirname, '../config/google-credentials.json');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }
  return null;
}

async function downloadDatabase(auth) {
  const drive = google.drive({ version: 'v3', auth });
  
  // Search for database file
  const res = await drive.files.list({
    q: "name='almadina-agro-db.sqlite'",
    fields: 'files(id, name)',
  });
  
  if (res.data.files.length === 0) {
    console.log('No database file found in Drive');
    return false;
  }
  
  const fileId = res.data.files[0].id;
  const dest = fs.createWriteStream(DB_PATH);
  
  return new Promise((resolve, reject) => {
    drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
      .then(response => {
        response.data
          .on('end', () => {
            console.log('Database downloaded from Drive');
            resolve(true);
          })
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
}

async function uploadDatabase(auth) {
  const drive = google.drive({ version: 'v3', auth });
  
  // Check if file exists
  const res = await drive.files.list({
    q: "name='almadina-agro-db.sqlite'",
    fields: 'files(id)',
  });
  
  const fileMetadata = {
    name: 'almadina-agro-db.sqlite',
  };
  
  const media = {
    mimeType: 'application/x-sqlite3',
    body: fs.createReadStream(DB_PATH),
  };
  
  if (res.data.files.length > 0) {
    // Update existing file
    await drive.files.update({
      fileId: res.data.files[0].id,
      media,
    });
    console.log('Database updated on Drive');
  } else {
    // Create new file
    await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id',
    });
    console.log('Database uploaded to Drive');
  }
  return true;
}

async function syncDatabase() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.log('Google Drive credentials not found');
      return false;
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const auth = await authorize(credentials);
    
    if (!auth) {
      console.log('Google Drive not authenticated');
      return false;
    }
    
    // Download first to get latest version
    await downloadDatabase(auth);
    
    // Then upload to update with local changes
    await uploadDatabase(auth);
    
    return true;
  } catch (error) {
    console.error('Google Drive sync error:', error);
    return false;
  }
}

module.exports = {
  authorize,
  syncDatabase,
  getAuthUrl: async () => {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]
    );
    
    return oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  },
  storeToken: async (code) => {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]
    );
    
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    return tokens;
  }
};