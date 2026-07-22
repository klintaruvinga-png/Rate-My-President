const express = require('express');
const { query } = require('../db/client');
const { validateUserId } = require('../utils/validateUserId');

const router = express.Router();

// Normalize client action vocabulary to the canonical stored values.
// The UI uses "approve/oppose" in copy; older cached client bundles may still
// send "approve"/"disapprove". Mapping them keeps the API tolerant of naming
// drift (and stale browser caches) instead of 400'ing valid votes.
const ACTION_ALIASES = {
  approve: 'like',
  disapprove: 'nolike',
  oppose: 'nolike',
  reject: 'nolike',
};
function normalizeAction(action) {
  if (!action) return action;
  return ACTION_ALIASES[action] || action;
}

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

// Idempotently ensure the user row exists before we log a swipe. This removes
// the registration/swipe race: a swipe arriving before /api/user/register
// completes would otherwise violate the swipe_logs.user_id FK. ON CONFLICT
// keeps this safe if the user registered a moment earlier.
async function ensureUser(userId) {
  const now = new Date().toISOString();
  await query(
    `INSERT INTO users (user_id, created_at, last_seen)
     VALUES (:userId, :createdAt, :lastSeen)
     ON CONFLICT (user_id) DO UPDATE SET last_seen = :lastSeen`,
    { ':userId': userId, ':createdAt': now, ':lastSeen': now }
  );
}

router.post('/log', async (req, res) => {
  const { userId, presidentId, cardType, action } = req.body;
  const normalizedAction = normalizeAction(action);

  if (!userId || !presidentId || !cardType || !action) {
    console.error('[swipes/log] 400 Missing required fields. Body:', JSON.stringify(req.body));
    return res.status(400).json({ error: 'Missing required fields', received: req.body });
  }
  if (!validateUserId(userId)) {
    console.error('[swipes/log] 400 Invalid userId format. Body:', JSON.stringify(req.body));
    return res.status(400).json({ error: 'Invalid userId format', received: req.body });
  }
  const validActions = ['like', 'nolike', 'skip'];
  if (!validActions.includes(normalizedAction)) {
    console.error('[swipes/log] 400 Invalid action. Body:', JSON.stringify(req.body));
    return res.status(400).json({ error: 'Invalid action', received: req.body });
  }
  const validCardTypes = ['home', 'global'];
  if (!validCardTypes.includes(cardType)) {
    console.error('[swipes/log] 400 Invalid card type. Body:', JSON.stringify(req.body));
    return res.status(400).json({ error: 'Invalid card type', received: req.body });
  }

  try {
    // Guarantee the user row exists so the swipe_logs FK can't fail on a
    // register/swipe race.
    await ensureUser(userId);

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
        ':cardType': cardType, ':action': normalizedAction
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
