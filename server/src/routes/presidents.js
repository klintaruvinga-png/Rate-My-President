const express = require('express');
const { getDatabase } = require('../db/client');

const router = express.Router();

/**
 * GET /presidents
 * Returns all presidents with optional region and active filters.
 * Query params: region (string), active (0|1)
 */
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const { region, active } = req.query;

    let query = 'SELECT * FROM presidents';
    const params = [];

    if (region) {
      query += ' WHERE region = ?';
      params.push(region);
    }

    if (active !== undefined) {
      const activeValue = active === '1' ? 1 : 0;
      query += region ? ' AND active = ?' : ' WHERE active = ?';
      params.push(activeValue);
    }

    query += ' ORDER BY name ASC';

    const stmt = db.prepare(query);
    stmt.bind(params);

    const presidents = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      presidents.push(row);
    }
    stmt.free();

    res.json(presidents);
  } catch (error) {
    console.error('Presidents get error:', error);
    res.status(500).json({ error: 'Failed to get presidents' });
  }
});

/**
 * GET /presidents/:id
 * Returns a single president by ID.
 * @param {string} id - President ID
 */
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const stmt = db.prepare('SELECT * FROM presidents WHERE id = ?');
    stmt.bind([id]);

    let president = null;
    if (stmt.step()) {
      president = stmt.getAsObject();
    }
    stmt.free();

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
