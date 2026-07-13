const express = require('express');
const { getDatabase, saveDatabase } = require('../db/client');
const { validateUserId } = require('../utils/validateUserId');
const crypto = require('crypto');

const router = express.Router();

/**
 * Generate a secure server-side user ID
 * This prevents client-side ID manipulation and allows server-side tracking
 */
router.post('/register', (req, res) => {
  try {
    const db = getDatabase();
    
    // Generate a cryptographically secure random user ID
    const userId = 'user_' + crypto.randomBytes(16).toString('hex');
    const createdAt = new Date().toISOString();
    
    // Store the user ID in the database
    const stmt = db.prepare('INSERT INTO users (user_id, created_at, last_seen) VALUES (:userId, :createdAt, :lastSeen)');
    stmt.bind({ 
      ':userId': userId, 
      ':createdAt': createdAt,
      ':lastSeen': createdAt
    });
    stmt.step();
    stmt.free();
    
    saveDatabase();
    
    res.json({ 
      userId,
      createdAt
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * Update last seen timestamp for a user
 * This helps track active users and detect abuse patterns
 */
router.post('/heartbeat', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  if (!validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const db = getDatabase();
    const lastSeen = new Date().toISOString();
    
    const stmt = db.prepare('UPDATE users SET last_seen = :lastSeen WHERE user_id = :userId');
    stmt.bind({ ':lastSeen': lastSeen, ':userId': userId });
    stmt.step();
    stmt.free();
    
    saveDatabase();
    
    res.json({ success: true, lastSeen });
  } catch (error) {
    console.error('User heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update user heartbeat' });
  }
});

module.exports = router;
