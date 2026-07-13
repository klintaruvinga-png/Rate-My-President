const express = require('express');
const { getDatabase, saveDatabase } = require('../db/client');

const router = express.Router();

function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  // userId should be between 5 and 100 characters
  if (userId.length < 5 || userId.length > 100) {
    return false;
  }
  // userId should only contain alphanumeric characters, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return false;
  }
  return true;
}

const ALLOWED_PREFERENCE_FIELDS = [
  'home_country',
  'show_micro_history',
  'notifications_enabled',
  'notification_frequency',
  'motion_enabled',
  'leaderboard_default_sort',
  'leaderboard_default_window',
  'data_collection_opt_in',
  'theme',
  'language'
];

function getPreferencesByUserId(db, userId) {
  const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = :userId');
  stmt.bind({ ':userId': userId });

  let preferences = null;

  if (stmt.step()) {
    const row = stmt.get();
    const columns = stmt.getColumnNames();
    preferences = {};
    columns.forEach((col, index) => {
      preferences[col] = row[index];
    });
  }
  stmt.free();

  return preferences;
}

router.get('/', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  if (!validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const db = getDatabase();
    const preferences = getPreferencesByUserId(db, userId);

    if (preferences) {
      res.json(preferences);
    } else {
      // Return default preferences
      res.json({
        user_id: userId,
        home_country: null,
        show_micro_history: 1,
        notifications_enabled: 0,
        notification_frequency: 'daily',
        motion_enabled: 1,
        leaderboard_default_sort: 'rank',
        leaderboard_default_window: 'day',
        data_collection_opt_in: 0,
        theme: 'dark',
        language: 'en',
        updated_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Preferences get error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

router.patch('/', (req, res) => {
  const { userId, preferences } = req.body;

  if (!userId || !preferences) {
    return res.status(400).json({ error: 'Missing userId or preferences' });
  }

  if (!validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const db = getDatabase();

    // Check if user exists
    const checkStmt = db.prepare('SELECT user_id FROM user_preferences WHERE user_id = :userId');
    checkStmt.bind({ ':userId': userId });
    let userExists = false;
    if (checkStmt.step()) {
      userExists = true;
    }
    checkStmt.free();

    const fields = [];
    const values = {};

    // Whitelist and validate preference keys
    Object.keys(preferences).forEach(key => {
      if (ALLOWED_PREFERENCE_FIELDS.includes(key)) {
        fields.push(`${key} = :${key}`);
        values[`:${key}`] = preferences[key];
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid preference fields provided' });
    }

    values[':updatedAt'] = new Date().toISOString();
    values[':userId'] = userId;

    if (userExists) {
      // Update existing
      const query = `UPDATE user_preferences SET ${fields.join(', ')}, updated_at = :updatedAt WHERE user_id = :userId`;
      const updateStmt = db.prepare(query);
      updateStmt.bind(values);
      updateStmt.step();
      updateStmt.free();
    } else {
      // Insert new
      const whitelistedKeys = Object.keys(preferences).filter(k => ALLOWED_PREFERENCE_FIELDS.includes(k));
      const allFields = ['user_id', ...whitelistedKeys, 'updated_at'];
      const placeholders = allFields.map(f => `:${f}`).join(', ');
      const allValues = {
        ':user_id': userId,
        ':updated_at': new Date().toISOString()
      };

      whitelistedKeys.forEach(key => {
        allValues[`:${key}`] = preferences[key];
      });

      const query = `INSERT INTO user_preferences (${allFields.join(', ')}) VALUES (${placeholders})`;
      const insertStmt = db.prepare(query);
      insertStmt.bind(allValues);
      insertStmt.step();
      insertStmt.free();
    }

    saveDatabase();

    // Return updated preferences
    const updatedPrefs = getPreferencesByUserId(db, userId);

    if (updatedPrefs) {
      res.json(updatedPrefs);
    } else {
      res.status(500).json({ error: 'Failed to retrieve updated preferences' });
    }
  } catch (error) {
    console.error('Preferences patch error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
