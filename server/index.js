// server/index.js
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = 3001;
const JWT_SECRET = "your_jwt_secret_key"; // Change this in production!

// Middleware
app.use(cors());
app.use(express.json());

// Create database connection with absolute path
const dbPath = path.join(__dirname, "db", "todo.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to the SQLite database.");
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);
    // Create tasks table with user_id
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      user_id INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  }
});

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// Register endpoint
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.json({ message: "User registered successfully" });
    }
  );
});

// Login endpoint
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.json({ token });
    }
  );
});

// GET all tasks for logged-in user
app.get("/api/tasks", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM tasks WHERE user_id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error("[ERROR] /api/tasks:", err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// POST new task for logged-in user
app.post("/api/tasks", authenticateToken, (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  db.run(
    "INSERT INTO tasks (title, user_id) VALUES (?, ?)",
    [title, req.user.id],
    function (err) {
      if (err) {
        console.error("[ERROR] /api/tasks POST:", err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        title,
        completed: false,
        user_id: req.user.id,
      });
    }
  );
});

// PUT update task for logged-in user
app.put("/api/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  db.run(
    "UPDATE tasks SET title = ?, completed = ? WHERE id = ? AND user_id = ?",
    [title, completed ? 1 : 0, id, req.user.id],
    function (err) {
      if (err) {
        console.error("[ERROR] /api/tasks PUT:", err);
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      res.json({ id, title, completed });
    }
  );
});

// DELETE task for logged-in user
app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [id, req.user.id],
    function (err) {
      if (err) {
        console.error("[ERROR] /api/tasks DELETE:", err);
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      res.json({ message: "Task deleted successfully" });
    }
  );
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
