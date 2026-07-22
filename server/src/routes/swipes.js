const express = require('express');
const { query } = require('../db/client');
const { validateUserId } = require('../utils/validateUserId');

const router = express.Router();

function getServerDate() {
  return new Date().toISOString().slice(0, 10);
}

async function getSwipeLimit(userId) {
  const rows = await query(
    'SELECT home_country FROM user_preferences WHERE user_id = :userId',
    { ':userId': userId }
  );
  return rows.length > 0 && rows[0].home_country ? 2 : 1;
}

router.post('/log', async (req, res) => {
  const { userId, presidentId, cardType, action } = req.body;

  if (!userId || !presidentId || !cardType || !action) {
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
    const date = getServerDate();

    // Already voted today for this card type?
    const existing = await query(
      'SELECT id FROM swipe_logs WHERE user_id = :userId AND date = :date AND card_type = :cardType',
      { ':userId': userId, ':date': date, ':cardType': cardType }
    );
    if (existing.length > 0) {
      return res.status(400).json({
        allowed: false,
        reason: 'Already voted today for this card type'
      });
    }

    // Count today's swipes to enforce the daily limit.
    const todays = await query(
      'SELECT card_type FROM swipe_logs WHERE user_id = :userId AND date = :date',
      { ':userId': userId, ':date': date }
    );

    const limit = await getSwipeLimit(userId);
    if (todays.length >= limit) {
      return res.status(400).json({
        allowed: false,
        reason: 'Daily swipe limit reached'
      });
    }

    await query(
      'INSERT INTO swipe_logs (user_id, president_id, date, card_type, action) VALUES (:userId, :presidentId, :date, :cardType, :action)',
      {
        ':userId': userId, ':presidentId': presidentId, ':date': date,
        ':cardType': cardType, ':action': action
      }
    );

    res.json({ allowed: true });
  } catch (error) {
    console.error('Swipe logging error:', error);
    res.status(500).json({ error: 'Failed to log swipe' });
  }
});

router.get('/status', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid userId format' });

  try {
    const date = getServerDate();
    const rows = await query(
      'SELECT card_type, action FROM swipe_logs WHERE user_id = :userId AND date = :date',
      { ':userId': userId, ':date': date }
    );

    const swipeList = rows.map((row) => ({
      cardType: row.card_type,
      action: row.action
    }));

    const limit = await getSwipeLimit(userId);
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
