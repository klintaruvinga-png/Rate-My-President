const express = require('express');
const { getDatabase, saveDatabase } = require('../db/client');
const { validateUserId } = require('../utils/validateUserId');
const crypto = require('crypto');

const router = express.Router();

/**
 * Register a user with their client-generated local UUID
 * Accepts the client's existing userId to maintain consistency
 */
router.post('/register', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const db = getDatabase();
    const createdAt = new Date().toISOString();

    // Check if user already exists
    const checkStmt = db.prepare('SELECT user_id FROM users WHERE user_id = :userId');
    checkStmt.bind({ ':userId': userId });
    const userExists = checkStmt.step();
    checkStmt.free();

    if (userExists) {
      // User already registered, return existing record
      return res.json({
        userId,
        alreadyRegistered: true
      });
    }

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
 * Auto-creates user if they don't exist (for local UUIDs)
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
    
    // Check if user exists
    const checkStmt = db.prepare('SELECT user_id FROM users WHERE user_id = :userId');
    checkStmt.bind({ ':userId': userId });
    let userExists = false;
    if (checkStmt.step()) {
      userExists = true;
    }
    checkStmt.free();
    
    if (userExists) {
      // Update existing user
      const updateStmt = db.prepare('UPDATE users SET last_seen = :lastSeen WHERE user_id = :userId');
      updateStmt.bind({ ':lastSeen': lastSeen, ':userId': userId });
      updateStmt.step();
      updateStmt.free();
    } else {
      // Auto-create user with local UUID
      const insertStmt = db.prepare('INSERT INTO users (user_id, created_at, last_seen) VALUES (:userId, :createdAt, :lastSeen)');
      insertStmt.bind({ 
        ':userId': userId, 
        ':createdAt': lastSeen,
        ':lastSeen': lastSeen
      });
      insertStmt.step();
      insertStmt.free();
    }
    
    saveDatabase();
    
    res.json({ success: true, lastSeen });
  } catch (error) {
    console.error('User heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update user heartbeat' });
  }
});

module.exports = router;
