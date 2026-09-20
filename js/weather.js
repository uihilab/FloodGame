/**
 * weather.js - Dynamic Atmospheric Weather & Disaster System for FloodGame
 *
 * Uses a 2D HTML canvas overlay for rain (always visible, independent of 3D camera),
 * plus Three.js fog and scene lighting transitions for the sky/atmosphere.
 */

class WeatherSystem {
    constructor() {
        this.scene = null;
        this.dirLight = null;
        this.ambientLight = null;

        this.currentMode = 'clear'; // 'clear' | 'rain' | 'hurricane'
        this.pendingMode = null;

        // 2D Canvas rain overlay
        this.rainCanvas = null;
        this.rainCtx = null;
        this.rainDrops = [];
        this.rainAnimFrame = null;
        this.rainRunning = false;

        // Lightning
        this.lightningTimer = 0;
        this.isLightning = false;
        this.lightningInterval = null;

        // --- Sky & Lighting presets ---
        this.presets = {
            clear: {
                skyHex: '#d2e4f6',
                dirIntensity: 1.15,
                dirHex: 0xfffcf0,
                ambIntensity: 0.55,
                ambHex: 0xd5e2f5,
                fog: null
            },
            rain: {
                skyHex: '#9aaebb',       // Lighter overcast grey-blue
                dirIntensity: 0.88,
                dirHex: 0xbbc8d8,
                ambIntensity: 0.62,
                ambHex: 0x90a0b0,
                fog: { color: 0x9aaebb, density: 0.00008 }  // Very light mist
            },
            hurricane: {
                skyHex: '#526070',       // Lighter dark stormy blue-grey
                dirIntensity: 0.62,
                dirHex: 0x7890a0,
                ambIntensity: 0.58,
                ambHex: 0x607080,
                fog: { color: 0x526070, density: 0.00020 }  // Lighter storm fog
            }
        };

        // Lighting defaults (Sunny) - for Three.Color objects created after init
        this.defaultSkyColor = null;
    }

    // ─────────────────────────────────────────────
    // Core init: called once the Three.js scene exists
    // ─────────────────────────────────────────────
    init(scene, camera, dirLight, ambientLight) {
        this.scene = scene;
        this.dirLight = dirLight;
        this.ambientLight = ambientLight;

        // THREE is a module import — exposed as window.THREE by main_v33.js
        const T = (typeof THREE !== 'undefined') ? THREE : window.THREE;
        if (T) this.defaultSkyColor = new T.Color(this.presets.clear.skyHex);

        this._createRainCanvas();

        // Apply any weather that was queued before scene was ready
        if (this.pendingMode) {
            this.setWeather(this.pendingMode);
            this.pendingMode = null;
        }

        console.log('[WeatherSystem] initialized.');
    }

    // ─────────────────────────────────────────────
    // Create transparent HTML canvas layered over the 3D canvas
    // ─────────────────────────────────────────────
    _createRainCanvas() {
        // Remove old canvas if re-initialising
        if (this.rainCanvas) {
            this.rainCanvas.remove();
        }

        const canvas = document.createElement('canvas');
        canvas.id = 'weather-rain-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 800;
            display: none;
        `;
        document.body.appendChild(canvas);

        this.rainCanvas = canvas;
        this.rainCtx = canvas.getContext('2d');

        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    _resizeCanvas() {
        if (!this.rainCanvas) return;
        this.rainCanvas.width = window.innerWidth;
        this.rainCanvas.height = window.innerHeight;
        this._initDrops();
    }

    _initDrops() {
        const isHurricane = this.currentMode === 'hurricane';
        const count = isHurricane ? 280 : 220;  // fewer drops overall
        this.rainDrops = [];

        for (let i = 0; i < count; i++) {
            this.rainDrops.push(this._newDrop());
        }
    }

    _newDrop() {
        const isHurricane = this.currentMode === 'hurricane';
        const w = window.innerWidth;
        const h = window.innerHeight;
        return {
            x: Math.random() * w * 1.5 - w * 0.25,
            y: Math.random() * h,
            // Hurricane drops much shorter and less opaque so they don't distract
            length: isHurricane ? (Math.random() * 10 + 6) : (Math.random() * 14 + 6),
            speed: isHurricane ? (Math.random() * 18 + 16) : (Math.random() * 10 + 7),
            opacity: isHurricane ? (Math.random() * 0.22 + 0.12) : (Math.random() * 0.30 + 0.18),
            windX: isHurricane ? -(Math.random() * 12 + 8) : -(Math.random() * 3 + 1)
        };
    }

    _animateRain() {
        if (!this.rainRunning || !this.rainCtx) return;

        // Throttle to ~30fps to save CPU/battery
        const now = performance.now();
        if (now - (this._lastRainFrame || 0) < 33) {
            this.rainAnimFrame = requestAnimationFrame(() => this._animateRain());
            return;
        }
        this._lastRainFrame = now;

        const ctx = this.rainCtx;
        const w = this.rainCanvas.width;
        const h = this.rainCanvas.height;
        const isHurricane = this.currentMode === 'hurricane';

        ctx.clearRect(0, 0, w, h);

        for (let drop of this.rainDrops) {
            ctx.save();
            ctx.strokeStyle = isHurricane ? `rgba(150,190,220,${drop.opacity})` : `rgba(180,210,240,${drop.opacity})`;
            ctx.lineWidth = isHurricane ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x + drop.windX, drop.y + drop.length);
            ctx.stroke();
            ctx.restore();

            // Advance drop
            drop.x += drop.windX;
            drop.y += drop.speed;

            // Wrap when off-screen
            if (drop.y > h + 20 || drop.x < -100) {
                Object.assign(drop, this._newDrop());
                drop.y = Math.random() * -50; // start above screen
            }
        }

        this.rainAnimFrame = requestAnimationFrame(() => this._animateRain());
    }

    // ─────────────────────────────────────────────
    // Public: set weather mode
    // ─────────────────────────────────────────────
    setWeather(mode) {
        this.currentMode = mode;

        if (!this.scene) {
            this.pendingMode = mode;
            this._updateHUDBadge(mode);
            return;
        }

        // THREE is a module import in main_v33.js, exposed as window.THREE
        const T = (typeof THREE !== 'undefined') ? THREE : window.THREE;
        const preset = this.presets[mode] || this.presets.clear;

        // --- Sky background ---
        if (T && this.scene.background) {
            this.scene.background.set(preset.skyHex);
        } else if (T) {
            this.scene.background = new T.Color(preset.skyHex);
        }

        // --- Fog ---
        if (T && preset.fog) {
            this.scene.fog = new T.FogExp2(preset.fog.color, preset.fog.density);
        } else {
            this.scene.fog = null;
        }

        // --- Lighting ---
        if (this.dirLight) {
            this.dirLight.intensity = preset.dirIntensity;
            if (this.dirLight.color && this.dirLight.color.set) this.dirLight.color.set(preset.dirHex);
        }
        if (this.ambientLight) {
            this.ambientLight.intensity = preset.ambIntensity;
            if (this.ambientLight.color && this.ambientLight.color.set) this.ambientLight.color.set(preset.ambHex);
        }

        // --- Rain canvas ---
        this._stopRain();
        if (mode === 'rain' || mode === 'hurricane') {
            this._initDrops();
            this.rainCanvas.style.display = 'block';
            this.rainRunning = true;
            this._animateRain();
        }

        // --- Lightning ---
        this._stopLightning();
        if (mode === 'hurricane') {
            this._startLightning();
        }

        this._updateHUDBadge(mode);
    }

    _stopRain() {
        this.rainRunning = false;
        if (this.rainAnimFrame) {
            cancelAnimationFrame(this.rainAnimFrame);
            this.rainAnimFrame = null;
        }
        if (this.rainCanvas) {
            this.rainCanvas.style.display = 'none';
            if (this.rainCtx) {
                this.rainCtx.clearRect(0, 0, this.rainCanvas.width, this.rainCanvas.height);
            }
        }
    }

    _startLightning() {
        const flash = () => {
            if (this.currentMode !== 'hurricane') return;

            // Flash the ambient light and sky briefly
            const originalAmbInt = this.ambientLight ? this.ambientLight.intensity : 0;
            const originalDirInt = this.dirLight ? this.dirLight.intensity : 0;

            if (this.ambientLight) this.ambientLight.intensity = 1.6;
            if (this.dirLight) this.dirLight.intensity = 2.2;
            if (this.scene.background) this.scene.background.set('#8ab0d0');

            setTimeout(() => {
                if (this.ambientLight) this.ambientLight.intensity = 0.1;
                if (this.scene.background) this.scene.background.set('#141b22');
                setTimeout(() => {
                    if (this.ambientLight) this.ambientLight.intensity = 1.8;
                    if (this.scene.background) this.scene.background.set('#5a80a0');
                    setTimeout(() => {
                        if (this.ambientLight) this.ambientLight.intensity = originalAmbInt;
                        if (this.dirLight) this.dirLight.intensity = originalDirInt;
                        if (this.scene.background) this.scene.background.set(this.presets.hurricane.skyHex);
                    }, 80);
                }, 60);
            }, 70);
        };

        // Fire lightning every 8-15 seconds
        const schedule = () => {
            if (this.currentMode !== 'hurricane') return;
            this.lightningInterval = setTimeout(() => {
                flash();
                schedule();
            }, 8000 + Math.random() * 7000);
        };
        schedule();
    }

    _stopLightning() {
        if (this.lightningInterval) {
            clearTimeout(this.lightningInterval);
            this.lightningInterval = null;
        }
    }

    // update() is called from animate() — kept for API compatibility,
    // rain is now driven by its own requestAnimationFrame loop
    update(delta, elapsed) {}

    _updateHUDBadge(mode) {
        const badge = document.getElementById('weather-hud-badge');
        if (!badge) return;
        if (mode === 'clear') {
            badge.innerHTML = `<i class="fas fa-sun" style="color:#f59e0b;"></i> Clear & Sunny`;
            badge.style.borderColor = 'rgba(245,158,11,0.4)';
        } else if (mode === 'rain') {
            badge.innerHTML = `<i class="fas fa-cloud-showers-heavy" style="color:#38bdf8;"></i> Rainstorm`;
            badge.style.borderColor = 'rgba(56,189,248,0.4)';
        } else if (mode === 'hurricane') {
            badge.innerHTML = `<i class="fas fa-wind" style="color:#ef4444;"></i> Cat 4 Hurricane`;
            badge.style.borderColor = 'rgba(239,68,68,0.6)';
        }
    }

    // Legacy alias used by cycleWeatherAtmosphere()
    updateHUDWeatherBadge(mode) { this._updateHUDBadge(mode); }
}

// Global singleton
window.WeatherSystem = new WeatherSystem();
