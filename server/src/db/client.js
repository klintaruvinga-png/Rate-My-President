const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL = null;
let db = null;
let readyPromise = null;
// Resolved at init() time. Defaults to the repo-local data dir for dev.
// In prod this MUST point at a mounted, persistent volume (e.g. /data/...),
// otherwise the container FS is ephemeral and the DB resets every deploy.
let dbPath = null;

/**
 * Cheap writability probe for the resolved DB directory. Surfaces volume
 * misconfiguration early in the deploy log instead of failing silently on
 * the first save.
 */
function isDirWritable(dir) {
  try {
    const probe = path.join(dir, `.rmp-write-probe-${Date.now()}`);
    fs.writeFileSync(probe, '');
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize the SQLite database.
 * Loads sql.js, creates or opens the database file, applies schema and seed data if needed.
 * @returns {Promise<Database>} The initialized database instance
 */
async function init() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    SQL = await initSqlJs();

    // DB_PATH lets us point the SQLite file at a persistent volume.
    // If unset, fall back to repo-local ./data (dev). NEVER rely on the
    // fallback in production — the container FS is wiped on every redeploy.
    dbPath = process.env.DB_PATH
      ? path.resolve(process.env.DB_PATH)
      : path.join(__dirname, '../../data/rate-my-president.db');

    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    console.log(`[db] database path: ${dbPath}`);
    console.log(`[db] dir writable: ${isDirWritable(dataDir)}`);
    if (!process.env.DB_PATH) {
      console.warn('[db] WARNING: DB_PATH not set — using ephemeral repo-local path. Data will NOT survive deploys.');
    }

    const isNewDatabase = !fs.existsSync(dbPath);

    if (isNewDatabase) {
      db = new SQL.Database();
    } else {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    }

    // Apply schema for both new and existing databases to ensure tables exist
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.run(schema);

    // Migration: ensure swipe_logs.president_id exists on deployed DBs created
    // before the column was added (CREATE TABLE IF NOT EXISTS skips existing tables).
    const colCheck = db.prepare("PRAGMA table_info(swipe_logs)");
    let hasPresidentId = false;
    while (colCheck.step()) {
      const row = colCheck.get();
      if (row[1] === 'president_id') hasPresidentId = true;
    }
    colCheck.free();
    if (!hasPresidentId) {
      db.run('ALTER TABLE swipe_logs ADD COLUMN president_id TEXT;');
      db.run('CREATE INDEX IF NOT EXISTS idx_swipe_logs_president ON swipe_logs(president_id);');
      saveDatabaseSync();
    }

    // Check if presidents table is empty and seed if needed
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM presidents');
    countStmt.step();
    const count = countStmt.getAsObject().count;
    countStmt.free();

    if (count === 0) {
      const seed = fs.readFileSync(path.join(__dirname, 'seed-presidents.sql'), 'utf8');
      db.run(seed);
      saveDatabase();
    }

    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON;');

    return db;
  })();
  return readyPromise;
}

/**
 * Get the database instance.
 * @returns {Database} The database instance
 * @throws {Error} If database has not been initialized
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized - call init() first');
  }
  return db;
}

/**
 * Synchronously save the database to disk.
 */
function saveDatabaseSync() {
  if (!db || !dbPath) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbPath, buffer);
}

/**
 * Save the database to disk (async wrapper around sync save).
 */
function saveDatabase() {
  if (!db) return;
  saveDatabaseSync();
}

/**
 * Close the database connection.
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { init, getDatabase, saveDatabase, closeDatabase };
