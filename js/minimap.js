/**
 * FloodGame - Real-World Satellite Minimap (Overview Radar)
 * 
 * Provides an Age of Empires style overview minimap using real-world 
 * Google Maps Satellite/Hybrid imagery, dynamically tracking the 3D camera 
 * viewport and frustum on the ground plane in real time.
 */

class MinimapManager {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.bgImage = (typeof Image !== "undefined") ? new Image() : null;
        if (this.bgImage) this.bgImage.crossOrigin = "anonymous";
        this.imageLoaded = false;
        this.currentCityKey = "iowa_city";
        this.currentCityName = "Iowa City, IA";
        this.mapType = "hybrid"; // "hybrid" or "satellite"
        this.isCollapsed = false;

        // Preset city GPS coordinates (latitude, longitude, zoom)
        this.cityCoordinates = {
            'iowa_city': { lat: 41.6611, lon: -91.5302, zoom: 16, name: 'Iowa City, IA' },
            'cedar_rapids': { lat: 41.9779, lon: -91.6656, zoom: 16, name: 'Cedar Rapids, IA' },
            'des_moines': { lat: 41.5868, lon: -93.6250, zoom: 16, name: 'Des Moines, IA' },
            'davenport': { lat: 41.5236, lon: -90.5776, zoom: 16, name: 'Davenport, IA' },
            'greenville': { lat: 33.4065, lon: -91.0610, zoom: 16, name: 'Greenville, MS' },
            'st_bernard': { lat: 29.8788, lon: -89.8456, zoom: 16, name: 'St. Bernard Parish, LA' },
            'baton_rouge': { lat: 30.4515, lon: -91.1871, zoom: 16, name: 'Baton Rouge, LA' }
        };

        // World coordinates bounds (-2500 to +2500)
        this.worldBounds = {
            minX: -2500,
            maxX: 2500,
            minZ: -2500,
            maxZ: 2500
        };

        // Three.js Raycaster & Math objects for zero-allocation frame updates
        this.raycaster = null;
        this.groundPlane = null;
        this.ndcCorners = [
            { x: -1, y: 1 },  // Top-Left
            { x: 1, y: 1 },   // Top-Right
            { x: 1, y: -1 },  // Bottom-Right
            { x: -1, y: -1 }  // Bottom-Left
        ];
        this.targetVec = null;
        this.tempVec2 = null;

        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // Cache DOM elements
        this.container = document.getElementById("minimap-hud");
        this.canvas = document.getElementById("minimap-canvas");
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext("2d");

        // High-DPI Canvas scaling
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = 245;
        const displayHeight = 245;

        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.displayWidth = displayWidth;
        this.displayHeight = displayHeight;

        // Three.js math caches
        if (window.THREE) {
            this.raycaster = new THREE.Raycaster();
            this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            this.targetVec = new THREE.Vector3();
            this.tempVec2 = new THREE.Vector2();
        }

        // Image load event listener
        this.bgImage.onload = () => {
            this.imageLoaded = true;
        };

        this.bgImage.onerror = () => {
            console.warn("[Minimap] Google Maps satellite image failed to load, using tactical fallback grid.");
            this.imageLoaded = false;
        };

        // Load initial satellite imagery
        this.loadSatelliteImage();

        // Bind UI Controls
        this.bindEvents();

        this.initialized = true;
        console.log("[Minimap] Initialized successfully.");
    }

    bindEvents() {
        const toggleBtn = document.getElementById("minimap-toggle-btn");
        if (toggleBtn) {
            toggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleCollapse();
            });
        }

        const modeBtn = document.getElementById("minimap-mode-btn");
        if (modeBtn) {
            modeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleMapType();
            });
        }

        this.bindAITutorObserver();
    }

    bindAITutorObserver() {
        const aiBubble = document.getElementById("ai-tutor-bubble");
        if (!aiBubble) return;

        const checkState = () => {
            const isVisible = !aiBubble.classList.contains("is-hidden") && aiBubble.style.display !== "none";
            if (this.container) {
                this.container.classList.toggle("is-slid-out", isVisible);
            }
        };

        const observer = new MutationObserver(() => {
            checkState();
        });

        observer.observe(aiBubble, { attributes: true, attributeFilter: ["class", "style"] });
        checkState();
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        if (this.container) {
            this.container.classList.toggle("is-collapsed", this.isCollapsed);
        }
        const toggleIcon = document.querySelector("#minimap-toggle-btn i");
        if (toggleIcon) {
            toggleIcon.className = this.isCollapsed ? "fas fa-chevron-up" : "fas fa-minus";
        }
    }

    toggleMapType() {
        this.mapType = this.mapType === "hybrid" ? "satellite" : "hybrid";
        const modeLabel = document.getElementById("minimap-mode-label");
        if (modeLabel) {
            modeLabel.textContent = this.mapType === "hybrid" ? "HYB" : "SAT";
        }
        this.loadSatelliteImage();
    }

    setLocation(cityKey, customName, lat, lon) {
        this.currentCityKey = cityKey || "iowa_city";
        if (customName) {
            this.currentCityName = customName;
        } else if (this.cityCoordinates[this.currentCityKey]) {
            this.currentCityName = this.cityCoordinates[this.currentCityKey].name;
        } else {
            this.currentCityName = "Iowa City, IA";
        }

        // If explicit coordinates given
        if (lat !== undefined && lon !== undefined) {
            this.cityCoordinates[this.currentCityKey] = {
                lat: lat,
                lon: lon,
                zoom: 15,
                name: this.currentCityName
            };
        }

        // Update header label
        const titleEl = document.getElementById("minimap-city-name");
        if (titleEl) {
            titleEl.textContent = this.currentCityName;
        }

        this.loadSatelliteImage();
    }

    loadSatelliteImage() {
        this.imageLoaded = false;
        const apiKey = window.GOOGLE_MAPS_API_KEY || "AIzaSyAi9ZclWNZruhG2e3mmR9GtH3p-V0dXgps";
        let center = "41.6611,-91.5302";
        let zoom = 16;

        if (this.cityCoordinates[this.currentCityKey]) {
            const info = this.cityCoordinates[this.currentCityKey];
            center = `${info.lat},${info.lon}`;
            zoom = info.zoom || 16;
        } else if (this.currentCityName) {
            center = encodeURIComponent(this.currentCityName);
            zoom = 16;
        }

        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=${zoom}&size=480x480&scale=2&maptype=${this.mapType}&key=${apiKey}`;
        this.bgImage.src = url;
    }

    /**
     * Converts a 3D world position (X, Z) to 2D Minimap Canvas coordinates (px, py)
     */
    worldToMinimap(x, z) {
        const { minX, maxX, minZ, maxZ } = this.worldBounds;
        const w = this.displayWidth;
        const h = this.displayHeight;

        // X world axis corresponds to Lat (North / South, North is +2500, South is -2500)
        // Z world axis corresponds to Lon (East / West, West is -2500, East is +2500)
        const px = ((z - minZ) / (maxZ - minZ)) * w;
        const py = ((maxX - x) / (maxX - minX)) * h;

        return { x: px, y: py };
    }

    /**
     * Render loop update: Redraws background + camera frustum box
     */
    update(camera, cameraControls) {
        if (!this.initialized && document.getElementById("minimap-canvas")) {
            this.init();
        }
        if (!this.initialized || !this.ctx || this.isCollapsed) return;

        // Auto-sync canvas backing buffer if DOM size changed
        const rect = this.canvas.getBoundingClientRect();
        const curW = Math.round(rect.width) || 245;
        const curH = Math.round(rect.height) || 245;
        const dpr = window.devicePixelRatio || 1;
        if (curW > 0 && curH > 0 && (this.displayWidth !== curW || this.displayHeight !== curH)) {
            this.displayWidth = curW;
            this.displayHeight = curH;
            this.canvas.width = curW * dpr;
            this.canvas.height = curH * dpr;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);
        }

        const ctx = this.ctx;
        const w = this.displayWidth;
        const h = this.displayHeight;

        // Clear previous frame
        ctx.clearRect(0, 0, w, h);

        // 1. Draw Satellite / Hybrid Background
        if (this.imageLoaded && this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
            ctx.drawImage(this.bgImage, 0, 0, w, h);
            // Subtle dark overlay to make UI frustum pop
            ctx.fillStyle = "rgba(10, 15, 29, 0.2)";
            ctx.fillRect(0, 0, w, h);
        } else {
            this.drawFallbackGrid();
        }

        // 2. Draw Subtle Radar Range Rings & Crosshairs
        this.drawRadarGrid(ctx, w, h);

        // 3. Draw Camera Frustum Viewport Polygon
        if (camera && window.THREE) {
            this.drawCameraFrustum(camera, ctx);
        }

        // 4. Draw North Compass Badge
        this.drawCompass(ctx, camera);
    }

    drawFallbackGrid() {
        const ctx = this.ctx;
        const w = this.displayWidth;
        const h = this.displayHeight;

        // Dark radar background
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "#0f172a");
        grad.addColorStop(1, "#1e293b");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
        ctx.lineWidth = 1;
        const step = w / 8;
        for (let i = 0; i <= w; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }
    }

    drawRadarGrid(ctx, w, h) {
        // Outer border
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 0, w, h);

        // Subtle center crosshairs
        const cx = w / 2;
        const cy = h / 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx, cy + 15);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
    }

    drawCameraFrustum(camera, ctx) {
        if (!this.raycaster || !this.groundPlane) {
            this.raycaster = new THREE.Raycaster();
            this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            this.targetVec = new THREE.Vector3();
            this.tempVec2 = new THREE.Vector2();
        }

        const corners = [];

        // Project the 4 viewport corners from NDC (-1..1) onto the 3D ground plane
        for (let i = 0; i < 4; i++) {
            const ndc = this.ndcCorners[i];
            this.tempVec2.set(ndc.x, ndc.y);
            this.raycaster.setFromCamera(this.tempVec2, camera);

            const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.targetVec);
            if (hit) {
                const pt = this.worldToMinimap(hit.x, hit.z);
                // Clamp slightly to map edges so frustum remains visible when panned
                corners.push({
                    x: Math.max(-10, Math.min(this.displayWidth + 10, pt.x)),
                    y: Math.max(-10, Math.min(this.displayHeight + 10, pt.y))
                });
            }
        }

        if (corners.length === 4) {
            // Fill camera viewport polygon with translucent glowing cyan
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            ctx.lineTo(corners[1].x, corners[1].y);
            ctx.lineTo(corners[2].x, corners[2].y);
            ctx.lineTo(corners[3].x, corners[3].y);
            ctx.closePath();

            // Glow styling
            ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#38bdf8";
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 8;
            ctx.stroke();

            // Draw corner anchor dots
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 4;
            corners.forEach(c => {
                ctx.beginPath();
                ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        }

        // Camera center target dot
        this.tempVec2.set(0, 0);
        this.raycaster.setFromCamera(this.tempVec2, camera);
        const centerHit = this.raycaster.ray.intersectPlane(this.groundPlane, this.targetVec);
        if (centerHit) {
            const centerPt = this.worldToMinimap(centerHit.x, centerHit.z);
            if (centerPt.x >= 0 && centerPt.x <= this.displayWidth && centerPt.y >= 0 && centerPt.y <= this.displayHeight) {
                ctx.save();
                ctx.fillStyle = "#f59e0b"; // Warm amber center dot
                ctx.shadowColor = "#f59e0b";
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(centerPt.x, centerPt.y, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    drawCompass(ctx, camera) {
        // Draw a sleek North indicator badge in the top-right of the minimap
        const padding = 14;
        const cx = this.displayWidth - padding;
        const cy = padding;

        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 8px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("N", cx, cy);
        ctx.restore();
    }
}

// Instantiate singleton and expose globally in browser environment
if (typeof window !== "undefined") {
    window.Minimap = new MinimapManager();

    if (typeof document !== "undefined") {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => window.Minimap.init());
        } else {
            window.Minimap.init();
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = MinimapManager;
}
