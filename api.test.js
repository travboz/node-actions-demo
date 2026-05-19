const test = require("node:test");
const assert = require("node:assert/strict");

// node --test auto-discovers files matching test.js / test/*.js
// We spin up the Express app directly — no network required.
const app = require("./src/app");
const http = require("node:http");

let server;
let baseUrl;

// ── helpers ────────────────────────────────────────────────────────────────

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        );
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── lifecycle ──────────────────────────────────────────────────────────────

test.before(() => {
  server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => new Promise((resolve) => server.close(resolve)));

// ── healthcheck ────────────────────────────────────────────────────────────

test("GET /api/v1/health returns 200 with status ok", async () => {
  const { status, body } = await request("GET", "/api/v1/health");
  assert.equal(status, 200);
  assert.equal(body.status, "ok");
  assert.ok(body.timestamp, "timestamp should be present");
});

// ── greeting ───────────────────────────────────────────────────────────────

test("POST /api/v1/greeting returns a greeting for a valid name", async () => {
  const { status, body } = await request("POST", "/api/v1/greeting", {
    name: "Alice",
  });
  assert.equal(status, 200);
  assert.equal(body.message, "Hello, Alice!");
});

test("POST /api/v1/greeting trims whitespace from name", async () => {
  const { status, body } = await request("POST", "/api/v1/greeting", {
    name: "  Bob  ",
  });
  assert.equal(status, 200);
  assert.equal(body.message, "Hello, Bob!");
});

test("POST /api/v1/greeting returns 400 when name is missing", async () => {
  const { status, body } = await request("POST", "/api/v1/greeting", {});
  assert.equal(status, 400);
  assert.equal(body.error, "name is required");
});

test("POST /api/v1/greeting returns 400 when name is blank", async () => {
  const { status, body } = await request("POST", "/api/v1/greeting", {
    name: "   ",
  });
  assert.equal(status, 400);
  assert.equal(body.error, "name is required");
});
