const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL = null;
let db = null;
let readyPromise = null;
let isDirty = false;
let flushTimer = null;

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
    } else {
      db = new SQL.Database();
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      db.run(schema);
      saveDatabase();
    }
    return db;
  })();
  return readyPromise;
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized - call init() first');
  }
  return db;
}

function saveDatabaseSync() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = path.join(__dirname, '../../data/rate-my-president.db');
  fs.writeFileSync(dbPath, buffer);
  isDirty = false;
}

function saveDatabase() {
  if (!db) return;
  saveDatabaseSync();
}

function flushDatabase() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (isDirty) {
    saveDatabaseSync();
  }
}

function closeDatabase() {
  flushDatabase();
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { init, getDatabase, saveDatabase, flushDatabase, closeDatabase };
