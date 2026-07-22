const express = require('express');
const { query } = require('../db/client');

const router = express.Router();

/**
 * GET /presidents
 * Returns all presidents with optional region and active filters.
 * Query params: region (string), active (0|1)
 */
router.get('/', async (req, res) => {
  try {
    const { region, active } = req.query;

    let sql = 'SELECT * FROM presidents';
    const params = [];

    if (region) {
      sql += ' WHERE region = ?';
      params.push(region);
    }
    if (active !== undefined) {
      const activeValue = active === '1' ? 1 : 0;
      sql += region ? ' AND active = ?' : ' WHERE active = ?';
      params.push(activeValue);
    }
    sql += ' ORDER BY name ASC';

    const presidents = await query(sql, params);
    res.json(presidents);
  } catch (error) {
    console.error('Presidents get error:', error);
    res.status(500).json({ error: 'Failed to get presidents' });
  }
});

/**
 * GET /presidents/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM presidents WHERE id = ?', [id]);
    const president = rows[0] || null;

    if (president) {
      res.json(president);
    } else {
      res.status(404).json({ error: 'President not found' });
    }
  } catch (error) {
    console.error('President get error:', error);
    res.status(500).json({ error: 'Failed to get president' });
  }
});

module.exports = router;
