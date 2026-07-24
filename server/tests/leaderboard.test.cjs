'use strict';
// Regression guard for the P0 leaderboard region 500 (RMP-13). The bug: region
// was concatenated onto the LEFT JOIN ... ON clause, producing invalid SQL
// (HTTP 500) when window=all. This test captures the SQL the handler builds and
// asserts region lands in WHERE with a valid ON-clause time filter — no live DB
// required (db/client.query is mocked).
const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

const ROUTES = require('node:path').join(__dirname, '..', 'src', 'routes', 'leaderboard.js');

let captured = null;

// Intercept requires so the handler runs without Postgres / third-party deps.
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const norm = String(request).replace(/\\/g, '/');
  if (norm === '../db/client' || norm.endsWith('db/client')) {
    return {
      query: async (sql, params) => {
        captured = { sql, params };
        return [];
      },
    };
  }
  if (norm === 'wilson-score-rank') {
    return { lowerBound: () => 0 };
  }
  return origLoad.apply(this, arguments);
};

const leaderboard = require(ROUTES);

// Extract the GET handler from the Express router stack.
function getHandler() {
  const layer = leaderboard.stack.find((l) => l.route && l.route.methods.get);
  assert.ok(layer, 'GET route layer not found');
  return layer.route.stack[0].handle;
}

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test.afterEach(() => {
  captured = null;
});

test('region + window=all builds valid SQL (the P0 crash case)', async () => {
  const handler = getHandler();
  const req = { query: { region: 'Europe', window: 'all' } };
  const res = makeRes();
  await handler(req, res);

  assert.ok(captured, 'query() was called');
  const sql = captured.sql;
  // Region must be in WHERE, not glued onto the JOIN ON clause.
  assert.ok(
    /WHERE p\.active = 1\s+AND p\.region = \?/.test(sql),
    `expected valid WHERE region clause, got:\n${sql}`
  );
  // The broken pattern: "ON p.id = sl.president_id p.region" (no AND).
  assert.ok(
    !/president_id p\.region/.test(sql),
    `SQL must not concatenate region onto the JOIN ON clause:\n${sql}`
  );
  // No time filter for window=all, so no "sl.created_at >=" clause.
  assert.ok(!/sl\.created_at >= /.test(sql), `window=all should have no time filter:\n${sql}`);
  assert.deepStrictEqual(captured.params, ['Europe']);
});

test('region + window=week keeps time filter in ON and region in WHERE', async () => {
  const handler = getHandler();
  const req = { query: { region: 'Asia', window: 'week' } };
  const res = makeRes();
  await handler(req, res);

  assert.ok(captured, 'query() was called');
  const sql = captured.sql;
  assert.ok(/LEFT JOIN swipe_logs sl ON p\.id = sl\.president_id\s+AND sl\.created_at >= \?/.test(sql),
    `expected time filter in ON clause:\n${sql}`);
  assert.ok(/WHERE p\.active = 1\s+AND p\.region = \?/.test(sql),
    `expected region in WHERE:\n${sql}`);
  assert.strictEqual(captured.params.length, 2);
  assert.strictEqual(captured.params[1], 'Asia');
});

test('invalid window returns 400 without calling query', async () => {
  const handler = getHandler();
  const req = { query: { window: 'fortnight' } };
  const res = makeRes();
  await handler(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(captured, null, 'query() must not run on invalid window');
});
