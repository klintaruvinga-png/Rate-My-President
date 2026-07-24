// Leaderboard route with hardened query handling and corrected calculations
const express = require('express');
const { query } = require('../db/client');
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
  return wilsonScore.lowerBound(likes, likes + dislikes);
}

/**
 * GET /leaderboard
 * Returns the leaderboard with vote counts, approval rate, and Wilson score.
 * Supports optional window (day|week|all) and region filtering.
 */
router.get('/', async (req, res) => {
  try {
    const { window = 'all', region } = req.query;

    const validWindows = ['day', 'week', 'all'];
    if (window && !validWindows.includes(window)) {
      return res.status(400).json({ error: 'Invalid window parameter. Must be one of: day, week, all' });
    }
    const validRegions = ['Africa', 'Europe', 'Asia', 'Americas', 'Oceania'];
    if (region && !validRegions.includes(region)) {
      return res.status(400).json({ error: 'Invalid region parameter. Must be one of: Africa, Europe, Asia, Americas, Oceania' });
    }

    const params = [];
    let timeJoinClause = '';
    let whereClause = '';
    const now = new Date();
    let startDate;

    if (window === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      timeJoinClause = 'AND sl.created_at >= ?';
      params.push(startDate.toISOString());
    } else if (window === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      timeJoinClause = 'AND sl.created_at >= ?';
      params.push(startDate.toISOString());
    }

    if (region) {
      // Region is on `presidents p`, not on `swipe_logs sl`, so it belongs in
      // WHERE (not the LEFT JOIN ON). Keeping the time filter in the ON clause
      // is required so non-matching presidents still appear with 0 votes.
      whereClause = 'AND p.region = ?';
      params.push(region);
    }

    const sql = `
      SELECT
        p.id,
        p.name,
        p.country,
        p.region,
        p.avatar_url,
        COALESCE(SUM(CASE WHEN sl.action = 'like' THEN 1 ELSE 0 END), 0)::int as likes,
        COALESCE(SUM(CASE WHEN sl.action = 'nolike' THEN 1 ELSE 0 END), 0)::int as dislikes,
        COALESCE(SUM(CASE WHEN sl.action = 'skip' THEN 1 ELSE 0 END), 0)::int as skips,
        COALESCE(COUNT(sl.id), 0)::int as total_votes
      FROM presidents p
      LEFT JOIN swipe_logs sl ON p.id = sl.president_id
        ${timeJoinClause}
      WHERE p.active = 1
        ${whereClause}
      GROUP BY p.id
      ORDER BY total_votes DESC
    `;

    const rows = await query(sql, params);
    const leaderboard = rows.map((row) => {
      const wilson = calculateWilsonScore(row.likes, row.dislikes);
      const approvalRate =
        (row.likes + row.dislikes) > 0
          ? (row.likes / (row.likes + row.dislikes) * 100).toFixed(1)
          : 0;
      return {
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
        wilson_score: wilson
      };
    });

    leaderboard.sort((a, b) => b.wilson_score - a.wilson_score);
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
