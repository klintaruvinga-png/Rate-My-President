// Postgres-backed DB client (replaces the previous sql.js / SQLite-WASM setup).
//
// Why Postgres: the SQLite file lived on the container's ephemeral filesystem,
// so all votes/leaderboards reset on every deploy. Railway's managed Postgres
// add-on persists across deploys and is not subject to the volume-size cap
// that blocked the previous approach.
//
// Connection is sourced from DATABASE_URL (Railway injects this automatically
// for a linked Postgres service). In local dev, set DATABASE_URL to a local
// Postgres, or fall back to the PG default socket if unset.

const { Pool } = require('pg');

let pool = null;
let readyPromise = null;

/**
 * Convert a sql.js-style query with `:named` placeholders into Postgres
 * `$n` positional form, returning the rewritten SQL and an ordered values
 * array. Accepts either a values object ({':userId': ...}) or an array
 * (positional, passed through untouched).
 *
 * This lets the existing route queries keep their :named bindings without a
 * full rewrite, while mapping onto node-postgres' positional params.
 *
 * @param {string} sql
 * @param {object|Array<any>|undefined} params
 * @returns {{ sql: string, values: Array<any> }}
 */
function bindParams(sql, params) {
  if (params == null) return { sql, values: [] };

  // Positional array form (e.g. presidents/:id, filtered presidents,
  // leaderboard window/region). SQLite uses '?' placeholders; Postgres needs
  // '$1', '$2', ... so translate them here.
  if (Array.isArray(params)) {
    let i = 0;
    const sqlOut = sql.replace(/\?/g, () => `$${++i}`);
    return { sql: sqlOut, values: params };
  }

  const values = [];
  const sqlOut = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, key) => {
    const namedKey = `:${key}`;
    if (!(namedKey in params)) {
      // Leave untouched if the key isn't provided; Postgres will surface a
      // clear error rather than silently misbinding.
      return match;
    }
    values.push(params[namedKey]);
    return `$${values.length}`;
  });
  return { sql: sqlOut, values };
}

/**
 * Run a query. `params` may be a :named object (converted to $n) or a
 * positional array. Always returns the row array (pg result rows).
 * @param {string} sql
 * @param {object|Array<any>|undefined} params
 * @returns {Promise<Array<object>>}
 */
async function query(sql, params) {
  if (!pool) {
    throw new Error('Database not initialized - call init() first');
  }
  const { sql: rewritten, values } = bindParams(sql, params);
  const result = await pool.query(rewritten, values);
  return result.rows;
}

async function init() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. Link a Railway Postgres service or set it locally.'
      );
    }

    pool = new Pool({
      connectionString,
      // Railway's Postgres uses a pooled proxy URL on a different port for
      // the connection pooler; ssl is required for the direct URL.
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Verify connectivity before proceeding.
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }

    console.log('[db] connected to Postgres');
    await applySchema();
    await seedIfEmpty();

    return pool;
  })();
  return readyPromise;
}

async function applySchema() {
  const schema = require('fs').readFileSync(
    require('path').join(__dirname, 'schema.sql'),
    'utf8'
  );
  // Postgres runs multiple statements via a single query when separated by ;
  // node-postgres supports multi-statement strings.
  await pool.query(schema);
  console.log('[db] schema applied');
}

async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM presidents');
  const count = rows[0]?.count ?? 0;
  if (count > 0) return;

  const seed = require('fs').readFileSync(
    require('path').join(__dirname, 'seed-presidents.sql'),
    'utf8'
  );
  await pool.query(seed);
  console.log('[db] presidents seeded');
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized - call init() first');
  }
  return pool;
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    readyPromise = null;
  }
}

module.exports = { init, getPool, query, closeDatabase };
