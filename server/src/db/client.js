const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL = null;
let db = null;
let readyPromise = null;

/**
 * Initialize the SQLite database.
 * Loads sql.js, creates or opens the database file, applies schema and seed data if needed.
 * @returns {Promise<Database>} The initialized database instance
 */
async function init() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    SQL = await initSqlJs();
    const dbPath = path.join(__dirname, '../../data/rate-my-president.db');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
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
    } else {
      db = new SQL.Database();
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      db.run(schema);
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
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = path.join(__dirname, '../../data/rate-my-president.db');
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
