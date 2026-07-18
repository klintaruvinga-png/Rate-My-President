// Leaderboard route with hardened query handling and corrected calculations
const express = require('express');
const { getDatabase } = require('../db/client');
const wilsonScore = require('wilson-score-rank');

const router = express.Router();

/**
 * Calculate Wilson score for ranking based on likes and dislikes.
 * Uses wilson-score-rank library to compute lower bound of confidence interval.
 * @param {number} likes - Number of positive votes
 * @param {number} dislikes - Number of negative votes
 * @returns {number} Wilson score (0 if no votes)
 */
// ponytail: use library for Wilson score, don't reinvent statistical math
function calculateWilsonScore(likes, dislikes) {
  const n = likes + dislikes;
  if (n === 0) return 0;
  return wilsonScore.lowerBound(likes, dislikes);
}

/**
 * GET /leaderboard
 * Returns the leaderboard with vote counts, approval rate, and Wilson score.
 * Supports optional window (day|week|all) and region filtering.
 * Query parameters are safely bound using prepared statements to prevent SQL injection.
 */
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { window = 'all', region } = req.query;

    // Validate window parameter
    const validWindows = ['day', 'week', 'all'];
    if (window && !validWindows.includes(window)) {
      return res.status(400).json({ error: 'Invalid window parameter. Must be one of: day, week, all' });
    }

    // Validate region parameter if provided
    const validRegions = ['Africa', 'Europe', 'Asia', 'Americas', 'Oceania'];
    if (region && !validRegions.includes(region)) {
      return res.status(400).json({ error: 'Invalid region parameter. Must be one of: Africa, Europe, Asia, Americas, Oceania' });
    }

    // Build query parameters and filter clause
    const params = [];
    let filterClause = '';
    const now = new Date();
    let startDate;

    if (window === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filterClause = 'AND sl.created_at >= ?';
      params.push(startDate.toISOString());
    } else if (window === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      filterClause = 'AND sl.created_at >= ?';
      params.push(startDate.toISOString());
    }

    if (region) {
      // Append region filter, respecting existing clause
      filterClause += (filterClause ? ' AND ' : '') + 'p.region = ?';
      params.push(region);
    }

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
      LEFT JOIN swipe_logs sl ON p.id = sl.president_id
        ${filterClause}
      WHERE p.active = 1
      GROUP BY p.id
      ORDER BY total_votes DESC
    `;

    const stmt = db.prepare(query);
    // Bind parameters (may be empty array)
    stmt.bind(params);
    const leaderboard = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const wilson = calculateWilsonScore(row.likes, row.dislikes);
      // Approval rate: exclude skips from denominator
      const approvalRate = (row.likes + row.dislikes) > 0 ? (row.likes / (row.likes + row.dislikes) * 100).toFixed(1) : 0;
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
        approval_rate: approvalRate,
        wilson_score: wilson,
      });
    }
    stmt.free();

    // Sort by Wilson score for fair ranking
    leaderboard.sort((a, b) => b.wilson_score - a.wilson_score);
    // Add rank
    leaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard get error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
