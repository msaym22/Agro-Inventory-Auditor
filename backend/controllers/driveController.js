// backend/controllers/driveController.js
const driveSync = require('../utils/driveSync');

exports.getAuthUrl = async (req, res) => {
  try {
    const authUrl = await driveSync.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get auth URL' });
  }
};

exports.authenticate = async (req, res) => {
  try {
    const { code } = req.body;
    const tokens = await driveSync.storeToken(code);
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

exports.syncDatabase = async (req, res) => {
  try {
    const success = await driveSync.syncDatabase();
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
};