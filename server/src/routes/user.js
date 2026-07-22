const express = require('express');
const { query } = require('../db/client');
const { validateUserId } = require('../utils/validateUserId');

const router = express.Router();

/**
 * Register a user with their client-generated local UUID.
 * Accepts the client's existing userId to maintain consistency.
 */
router.post('/register', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const existing = await query(
      'SELECT user_id FROM users WHERE user_id = :userId',
      { ':userId': userId }
    );
    if (existing.length > 0) {
      return res.json({ userId, alreadyRegistered: true });
    }

    const createdAt = new Date().toISOString();
    await query(
      'INSERT INTO users (user_id, created_at, last_seen) VALUES (:userId, :createdAt, :lastSeen)',
      { ':userId': userId, ':createdAt': createdAt, ':lastSeen': createdAt }
    );

    res.json({ userId, createdAt });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * Update last seen timestamp for a user. Auto-creates the user if missing
 * (local UUIDs are generated client-side).
 */
router.post('/heartbeat', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid userId format' });

  try {
    const lastSeen = new Date().toISOString();
    const existing = await query(
      'SELECT user_id FROM users WHERE user_id = :userId',
      { ':userId': userId }
    );

    if (existing.length > 0) {
      await query(
        'UPDATE users SET last_seen = :lastSeen WHERE user_id = :userId',
        { ':lastSeen': lastSeen, ':userId': userId }
      );
    } else {
      await query(
        'INSERT INTO users (user_id, created_at, last_seen) VALUES (:userId, :createdAt, :lastSeen)',
        { ':userId': userId, ':createdAt': lastSeen, ':lastSeen': lastSeen }
      );
    }

    res.json({ success: true, lastSeen });
  } catch (error) {
    console.error('User heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update user heartbeat' });
  }
});

module.exports = router;
