const express = require('express');
const { getDatabase, saveDatabase } = require('../db/client');

const router = express.Router();

function getServerDate() {
  return new Date().toISOString().slice(0, 10);
}

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

function getSwipeLimit(db, userId) {
  const prefStmt = db.prepare('SELECT home_country FROM user_preferences WHERE user_id = :userId');
  prefStmt.bind({ ':userId': userId });
  let homeCountry = null;
  if (prefStmt.step()) {
    const row = prefStmt.get();
    homeCountry = row[0];
  }
  prefStmt.free();

  return homeCountry ? 2 : 1;
}

router.post('/log', (req, res) => {
  const { userId, cardType, action } = req.body;

  if (!userId || !cardType || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  const validActions = ['like', 'nolike', 'skip'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const validCardTypes = ['home', 'global'];
  if (!validCardTypes.includes(cardType)) {
    return res.status(400).json({ error: 'Invalid card type' });
  }

  try {
    const db = getDatabase();
    const date = getServerDate();

    // Check if user already voted today for this card type
    const stmt = db.prepare('SELECT id FROM swipe_logs WHERE user_id = :userId AND date = :date AND card_type = :cardType');
    stmt.bind({ ':userId': userId, ':date': date, ':cardType': cardType });
    let existingId = null;
    if (stmt.step()) {
      const row = stmt.get();
      existingId = row[0];
    }
    stmt.free();

    if (existingId) {
      return res.status(400).json({
        allowed: false,
        reason: 'Already voted today for this card type'
      });
    }

    // Check daily limits
    const countStmt = db.prepare('SELECT card_type FROM swipe_logs WHERE user_id = :userId AND date = :date');
    countStmt.bind({ ':userId': userId, ':date': date });
    let swipeCount = 0;
    while (countStmt.step()) {
      swipeCount++;
    }
    countStmt.free();

    // Determine limit based on user's home country from preferences
    const limit = getSwipeLimit(db, userId);

    if (swipeCount >= limit) {
      return res.status(400).json({
        allowed: false,
        reason: 'Daily swipe limit reached'
      });
    }

    // Log the swipe
    const insertStmt = db.prepare('INSERT INTO swipe_logs (user_id, date, card_type, action) VALUES (:userId, :date, :cardType, :action)');
    insertStmt.bind({ ':userId': userId, ':date': date, ':cardType': cardType, ':action': action });
    insertStmt.step();
    insertStmt.free();

    saveDatabase();

    res.json({ allowed: true });
  } catch (error) {
    console.error('Swipe logging error:', error);
    res.status(500).json({ error: 'Failed to log swipe' });
  }
});

router.get('/status', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  if (!validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const db = getDatabase();
    const date = getServerDate();

    const stmt = db.prepare('SELECT card_type, action FROM swipe_logs WHERE user_id = :userId AND date = :date');
    stmt.bind({ ':userId': userId, ':date': date });

    const swipeList = [];
    while (stmt.step()) {
      const row = stmt.get();
      swipeList.push({
        cardType: row[0],
        action: row[1]
      });
    }
    stmt.free();

    // Get user's limit based on home country
    const limit = getSwipeLimit(db, userId);

    res.json({
      count: swipeList.length,
      limit,
      swipes: swipeList
    });
  } catch (error) {
    console.error('Swipe status error:', error);
    res.status(500).json({ error: 'Failed to get swipe status' });
  }
});

module.exports = router;
