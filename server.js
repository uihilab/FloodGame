const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL connection — configure via environment variables
const pool = new Pool({
    host:     process.env.PG_HOST     || "localhost",
    port:     process.env.PG_PORT     || 5432,
    database: process.env.PG_DATABASE || "floodgame",
    user:     process.env.PG_USER     || process.env.USER,
    password: process.env.PG_PASSWORD || "",
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// POST /log — body: { session_id, location, role, message }
app.post("/log", async (req, res) => {
    const { session_id, location, role, message } = req.body;

    if (!session_id || !role || !message) {
        return res.status(400).json({ error: "Missing required fields: session_id, role, message" });
    }
    if (role !== "user" && role !== "assistant") {
        return res.status(400).json({ error: "role must be 'user' or 'assistant'" });
    }

    try {
        await pool.query(
            `INSERT INTO ai_chat_logs (session_id, location, role, message)
             VALUES ($1, $2, $3, $4)`,
            [session_id, location || null, role, message]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("DB insert error:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /logs — retrieve the 100 most recent chat logs
app.get("/logs", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM ai_chat_logs ORDER BY timestamp DESC LIMIT 100");
        res.json(result.rows);
    } catch (err) {
        console.error("DB select error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3005;
const GAME_DIR = path.join(__dirname);

// POST /generate-map — body: { location: "City, State" }
app.post("/generate-map", (req, res) => {
    const { location } = req.body;
    if (!location || typeof location !== "string") {
        return res.status(400).json({ error: "location is required" });
    }
    const sanitized = location.replace(/[^a-zA-Z0-9\s,.\-]/g, "").trim();
    if (!sanitized) return res.status(400).json({ error: "Invalid location" });

    const script = path.join(GAME_DIR, "sources/maps/map_generator.py");
    const cmd = `python3 "${script}" --location "${sanitized}" --name custom`;

    console.log(`Generating map for: ${sanitized}`);
    exec(cmd, { cwd: GAME_DIR, timeout: 300000 }, (err, stdout, stderr) => {
        if (err) {
            console.error("Map generation failed:", stderr);
            return res.status(500).json({ error: "Map generation failed", detail: stderr });
        }
        // Read and return the generated files
        const mapDir = path.join(GAME_DIR, "sources/maps/custom");
        try {
            const ground   = JSON.parse(fs.readFileSync(path.join(mapDir, "GroundTiles.json")));
            const surface  = JSON.parse(fs.readFileSync(path.join(mapDir, "SurfaceTiles.json")));
            const surface2 = JSON.parse(fs.readFileSync(path.join(mapDir, "SurfaceTiles_v2.json")));
            const meta     = JSON.parse(fs.readFileSync(path.join(mapDir, "meta.json")));
            res.json({ success: true, meta, ground, surface, surface2 });
        } catch (e) {
            res.status(500).json({ error: "Could not read generated map files" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`FloodGame log server running on http://localhost:${PORT}`);
});
