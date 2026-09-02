require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3005;
const PGRST = process.env.POSTGREST_URL || "http://127.0.0.1:3006";
const ADMIN_KEY = process.env.ADMIN_KEY;
const JWT_SECRET = process.env.POSTGREST_JWT_SECRET;

const GAME_DIR = path.join(__dirname);
app.use(express.static(GAME_DIR));

function serviceToken() {
    return JWT_SECRET ? jwt.sign({ role: "floodgame_service" }, JWT_SECRET, { expiresIn: "1h" }) : "";
}

// postgrest call
async function db(path, method = "GET", body) {
    const r = await fetch(`${PGRST}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
            Authorization: `Bearer ${serviceToken()}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

//wraps a route so errors return a clean 500 instead of hanging
const route = (fn) => (req, res) =>
    fn(req, res).catch((e) => {
        console.error(e.message);
        res.status(500).json({ error: "Database error" });
    });

// api key for reading/editing/deleting
const admin = (req, res, next) =>
    req.header("x-api-key") === ADMIN_KEY
        ? next()
        : res.status(401).json({ error: "Unauthorized" });

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// CREATE
app.post("/log", route(async (req, res) => {
    const { session_id, location, role, message } = req.body;
    if (!session_id || !role || !message)
        return res.status(400).json({ error: "session_id, role and message are required" });
    const rows = await db("/ai_chat_logs", "POST", { session_id, location, role, message });
    res.status(201).json(rows[0]);
}));

// READ all
app.get("/get-logs", admin, route(async (req, res) => {
    let path = "/ai_chat_logs?order=timestamp.asc";
    if (req.query.session_id) path += `&session_id=eq.${req.query.session_id}`;
    res.json(await db(path));
}));

// READ one
app.get("/logs/:id", admin, route(async (req, res) => {
    const rows = await db(`/ai_chat_logs?id=eq.${Number(req.params.id)}`);
    res.json(rows[0] || null);
}));

// UPDATE — admin
app.patch("/logs/:id", admin, route(async (req, res) => {
    const rows = await db(`/ai_chat_logs?id=eq.${Number(req.params.id)}`, "PATCH", req.body);
    res.json(rows[0] || null);
}));

// DELETE — admin
app.delete("/logs/:id", admin, route(async (req, res) => {
    await db(`/ai_chat_logs?id=eq.${Number(req.params.id)}`, "DELETE");
    res.json({ deleted: true });
}));

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
            const ground = JSON.parse(fs.readFileSync(path.join(mapDir, "GroundTiles.json")));
            const surface = JSON.parse(fs.readFileSync(path.join(mapDir, "SurfaceTiles.json")));
            const surface2 = JSON.parse(fs.readFileSync(path.join(mapDir, "SurfaceTiles_v2.json")));
            const meta = JSON.parse(fs.readFileSync(path.join(mapDir, "meta.json")));
            res.json({ success: true, meta, ground, surface, surface2 });
        } catch (e) {
            res.status(500).json({ error: "Could not read generated map files" });
        }
    });
});

app.listen(PORT, () => console.log(`Gateway on ${PORT} -> ${PGRST}`));