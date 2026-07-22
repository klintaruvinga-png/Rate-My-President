const express = require('express');
const { query } = require('../db/client');
const { validateUserId } = require('../utils/validateUserId');

const router = express.Router();

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

async function getPreferencesByUserId(userId) {
  const rows = await query(
    'SELECT * FROM user_preferences WHERE user_id = :userId',
    { ':userId': userId }
  );
  return rows.length > 0 ? rows[0] : null;
}

router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid userId format' });

  try {
    const preferences = await getPreferencesByUserId(userId);
    if (preferences) {
      res.json(preferences);
    } else {
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

router.patch('/', async (req, res) => {
  const { userId, preferences } = req.body;
  if (!userId || !preferences) {
    return res.status(400).json({ error: 'Missing userId or preferences' });
  }
  if (!validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const existing = await getPreferencesByUserId(userId);

    const fields = [];
    const values = {};

    Object.keys(preferences).forEach((key) => {
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

    if (existing) {
      const sql = `UPDATE user_preferences SET ${fields.join(', ')}, updated_at = :updatedAt WHERE user_id = :userId`;
      await query(sql, values);
    } else {
      const whitelistedKeys = Object.keys(preferences).filter((k) =>
        ALLOWED_PREFERENCE_FIELDS.includes(k)
      );
      const allFields = ['user_id', ...whitelistedKeys, 'updated_at'];
      const placeholders = allFields.map((f) => `:${f}`).join(', ');
      const allValues = {
        ':user_id': userId,
        ':updated_at': new Date().toISOString()
      };
      whitelistedKeys.forEach((key) => {
        allValues[`:${key}`] = preferences[key];
      });

      const sql = `INSERT INTO user_preferences (${allFields.join(', ')}) VALUES (${placeholders})`;
      await query(sql, allValues);
    }

    const updatedPrefs = await getPreferencesByUserId(userId);
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
