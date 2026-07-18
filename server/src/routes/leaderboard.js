const express = require('express');
const { getDatabase } = require('../db/client');
const wilsonScore = require('wilson-score-rank');

const router = express.Router();

// ponytail: use library for Wilson score, don't reinvent statistical math
function calculateWilsonScore(likes, dislikes) {
  const n = likes + dislikes;
  if (n === 0) return 0;
  return wilsonScore.lowerBound(likes, dislikes);
}

router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { window = 'all', region } = req.query;

    // Build date filter based on window
    let dateFilter = '';
    const now = new Date();
    let startDate;

    switch (window) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = `AND sl.created_at >= '${startDate.toISOString()}'`;
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        dateFilter = `AND sl.created_at >= '${startDate.toISOString()}'`;
        break;
      case 'all':
      default:
        dateFilter = '';
        break;
    }

    // Build region filter
    let regionFilter = '';
    if (region) {
      regionFilter = `AND p.region = '${region}'`;
    }

    // Query presidents with their vote counts and Wilson score
    const query = `
      SELECT 
        p.id,
        p.name,
        p.country,
        p.region,
        p.avatar_url,
        COALESCE(SUM(CASE WHEN sl.action = 'like' THEN 1 ELSE 0 END), 0) as likes,
        COALESCE(SUM(CASE WHEN sl.action = 'nolike' THEN 1 ELSE 0 END), 0) as dislikes,
        COALESCE(SUM(CASE WHEN sl.action = 'skip' THEN 1 ELSE 0 END), 0) as skips,
        COALESCE(COUNT(sl.id), 0) as total_votes
      FROM presidents p
      LEFT JOIN swipe_logs sl ON p.id = sl.card_type
        ${dateFilter}
      WHERE p.active = 1
        ${regionFilter}
      GROUP BY p.id
      ORDER BY total_votes DESC
    `;

    const stmt = db.prepare(query);
    const leaderboard = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const wilson = calculateWilsonScore(row.likes, row.dislikes);
      
      leaderboard.push({
        id: row.id,
        name: row.name,
        country: row.country,
        region: row.region,
        avatar_url: row.avatar_url,
        likes: row.likes,
        dislikes: row.dislikes,
        skips: row.skips,
        total_votes: row.total_votes,
        approval_rate: row.total_votes > 0 ? (row.likes / row.total_votes * 100).toFixed(1) : 0,
        wilson_score: wilson
      });
    }
    stmt.free();

    // Sort by Wilson score for fair ranking
    leaderboard.sort((a, b) => b.wilson_score - a.wilson_score);

    // Add rank
    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard get error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
