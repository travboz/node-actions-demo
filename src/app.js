const express = require("express");

const app = express();

app.use(express.json());

// GET /api/v1/health
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// POST /api/v1/greeting
app.post("/api/v1/greeting", (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "name is required" });
  }

  res.json({ message: `Hello, ${name.trim()}!` });
});

module.exports = app;
