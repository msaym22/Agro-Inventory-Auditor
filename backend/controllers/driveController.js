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
    const force = req.query.force === 'true';
    const result = await driveSync.syncDatabase({ force });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const status = driveSync.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
};

// New endpoints for explicit pull/push
exports.updateDatabaseFromDrive = async (req, res) => {
  try {
    const db = require('../models');
    // Close current DB connection, then pull, then reload models/connection
    try { if (db.sequelize) await db.sequelize.close(); } catch (_) {}

    const result = await require('../utils/driveSync').pullDatabase();
    if (!result.success) {
      // Try to reopen previous connection to keep app alive
      await db.reloadSequelize?.();
      return res.status(500).json({ error: 'Pull failed', details: result.error || result.reason });
    }

    const reloaded = await (db.reloadSequelize?.() || Promise.resolve(false));
    if (!reloaded) {
      return res.status(500).json({ error: 'Pulled, but failed to reload database connection' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Pull failed' });
  }
};

exports.updateDriveFromDatabase = async (req, res) => {
  try {
    const db = require('../models');
    // Close the connection to guarantee a consistent on-disk snapshot
    try { if (db.sequelize) await db.sequelize.close(); } catch (_) {}
    const result = await require('../utils/driveSync').pushDatabase();
    // Re-open connection after upload
    await (db.reloadSequelize?.() || Promise.resolve(false));
    if (!result.success) {
      return res.status(500).json({ error: 'Push failed', details: result.error || result.reason });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Push failed' });
  }
};