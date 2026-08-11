// AI Tutor v24 — Mobile-Optimized Instant Location Engine & Desktop Web Worker AI
(function () {
    let worker = null;
    let isWorkerReady = false;
    let modelInitStarted = false;

    // Detect mobile / touch devices to bypass heavy 350MB WASM memory allocation & tab reloads
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window)
        || (window.innerWidth < 768);

    // ── DOM refs (bubble elements) ─────────────────────────────────────────
    function getInput()      { return document.getElementById("ai-chat-input"); }
    function getScrollArea() { return document.getElementById("ai-chat-scroll"); }

    // ── Message rendering ──────────────────────────────────────────────────
    function appendBubbleMsg(text, role) {
        const scroll = getScrollArea();
        if (!scroll) return null;

        const div = document.createElement("div");

        if (role === "tutor") {
            div.style.cssText = [
                "align-self:flex-start",
                "background:rgba(15,23,42,0.85)",
                "border-left:3px solid #00f0ff",
                "border-radius:8px",
                "padding:8px 12px",
                "color:#e2e8f0",
                "font-size:0.8rem",
                "line-height:1.5",
                "max-width:92%",
                "word-break:break-word"
            ].join(";");
        } else {
            div.style.cssText = [
                "align-self:flex-end",
                "background:linear-gradient(135deg,#00f0ff 0%,#3b82f6 100%)",
                "color:#0f172a",
                "font-weight:700",
                "border-radius:12px 12px 2px 12px",
                "padding:8px 12px",
                "font-size:0.8rem",
                "max-width:85%",
                "word-break:break-word"
            ].join(";");
        }

        div.textContent = text;
        scroll.appendChild(div);
        scroll.scrollTop = scroll.scrollHeight;
        return div;
    }

    function showTypingIndicator() {
        const scroll = getScrollArea();
        if (!scroll) return;
        const dots = document.createElement("div");
        dots.id = "ai-typing-dots";
        dots.style.cssText = [
            "align-self:flex-start",
            "color:#94a3b8",
            "font-size:1.2rem",
            "padding:4px 12px",
            "letter-spacing:4px"
        ].join(";");
        dots.textContent = "● ● ●";
        dots.animate([{ opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }],
            { duration: 900, iterations: Infinity });
        scroll.appendChild(dots);
        scroll.scrollTop = scroll.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = document.getElementById("ai-typing-dots");
        if (el) el.remove();
    }

    function setInputEnabled(enabled) {
        const input = getInput();
        if (input) {
            input.disabled = !enabled;
            input.style.opacity = enabled ? "1" : "0.6";
            input.placeholder = "Ask AI Flood Tutor...";
        }
        document.querySelectorAll(".ai-quick-chip").forEach(btn => {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? "1" : "0.45";
            btn.style.pointerEvents = enabled ? "auto" : "none";
        });
    }

    // ── Local Rule & Knowledge Response Engine (Instant 0ms Fallback) ─────────────
    function generateLocalAIResponse(text) {
        const cityName = document.getElementById("hud-city-name")?.textContent || "Iowa City";
        const remBudget = typeof window.totalAvailableMoney !== 'undefined' ? window.totalAvailableMoney : 50000000;
        const budgetMillions = (remBudget / 1000000).toFixed(1);
        const lower = text.toLowerCase().trim();

        // 1. Check City / Location Queries (including typos like "des moon", "where are we")
        if (lower.includes("where are we") || lower.includes("what city") || lower.includes("which map") || lower.includes("current location") || lower.includes("tell me about")) {
            if (lower.includes("des moines") || lower.includes("des moon") || lower.includes("des moin") || cityName.toLowerCase().includes("des moines")) {
                return "🏛️ You are managing Des Moines, Iowa — State Capital at the confluence of the Des Moines and Raccoon Rivers. Primary hazards include dual-river confluence surges threatening commercial centers (Com), police/fire stations (Pol/Fire), and water works plants (Wat).";
            } else if (lower.includes("cedar") || cityName.toLowerCase().includes("cedar rapids")) {
                return "🏭 You are managing Cedar Rapids, Iowa — a major industrial and food-processing hub on the Cedar River. Severe risk to industrial factories (Ind), water treatment utilities (Wat), and riverbank residential homes.";
            } else if (lower.includes("davenport") || cityName.toLowerCase().includes("davenport")) {
                return "🏞️ You are managing Davenport, Iowa — famous for having no permanent river wall on its Mississippi River frontage. Relies on temporary HESCO barriers, sandbags, and green park buffers to absorb spring flood crests.";
            } else if (lower.includes("greenville") || cityName.toLowerCase().includes("greenville")) {
                return "⚓ You are managing Greenville, Mississippi — a historic Mississippi River Delta port town with low-lying alluvial topography vulnerable to extended high-water stages.";
            } else if (lower.includes("bernard") || cityName.toLowerCase().includes("st. bernard")) {
                return "🌊 You are managing St. Bernard Parish, Louisiana — coastal parish near New Orleans highly vulnerable to Category 3+ Gulf hurricane storm surges and canal breaches.";
            } else {
                return "📍 You are currently playing on the " + cityName + " map (Remaining Budget: $" + budgetMillions + "M). View your location briefing card in the AI Guide for specific flood risks!";
            }
        }

        // Direct City Name Checks & History
        if (lower.includes("history") || lower.includes("past flood") || lower.includes("historically") || lower.includes("1993") || lower.includes("2008") || lower.includes("2019") || lower.includes("1927") || lower.includes("katrina")) {
            if (lower.includes("des moines") || lower.includes("des moon") || lower.includes("des moin") || cityName.toLowerCase().includes("des moines")) {
                return "📜 Des Moines Flood History: During the Great Flood of 1993, both the Des Moines and Raccoon Rivers overtopped levees, submerging the municipal Water Works plant and leaving 250,000 residents without running water for 12 days.";
            } else if (lower.includes("cedar") || cityName.toLowerCase().includes("cedar rapids")) {
                return "📜 Cedar Rapids Flood History: In June 2008, the Cedar River reached an unprecedented 31.12-foot crest (11 ft above record), submerging over 1,300 city blocks and displacing 18,000 residents.";
            } else if (lower.includes("iowa city") || cityName.toLowerCase().includes("iowa city")) {
                return "📜 Iowa City Flood History: In June 2008, Coralville Reservoir overflowed its spillway, sending a 31.5-foot Iowa River crest that damaged over 20 University of Iowa campus buildings.";
            } else if (lower.includes("davenport") || cityName.toLowerCase().includes("davenport")) {
                return "📜 Davenport Flood History: In May 2019, Davenport experienced a record 22.7-foot Mississippi River crest after temporary barriers breached, flooding riverfront commercial streets for 51 consecutive days.";
            } else if (lower.includes("greenville") || cityName.toLowerCase().includes("greenville")) {
                return "📜 Greenville Flood History: Epicenter of the Great 1927 Mississippi River Flood. On April 21, 1927, the main levee breached near Greenville, flooding 27,000 sq miles up to 30ft deep and stranding 13,000 refugees on the levee for weeks.";
            } else if (lower.includes("bernard") || cityName.toLowerCase().includes("st. bernard")) {
                return "📜 St. Bernard Parish Flood History: In August 2005 during Hurricane Katrina, Category 3+ storm surges breached MRGO and Industrial Canal levees, leaving 98% of St. Bernard Parish under 8–12 feet of water.";
            }
        }

        if (lower.includes("des moines") || lower.includes("des moon") || lower.includes("des moin")) {
            return "🏛️ Des Moines Flood Profile (Great Flood of 1993): Vulnerable to dual-river flooding where the Des Moines & Raccoon Rivers meet. In 1993, the water treatment plant was submerged. Build Flood Walls along both rivers to protect Water Works (Wat) and Commercial banks (Com)!";
        } else if (lower.includes("iowa city")) {
            return "🎓 Iowa City Flood Profile (2008 Flood): Bisected by the Iowa River. In 2008, Coralville Reservoir spillover damaged $750M of university property. Protect University Hospitals (Hos), research labs, and dormitories (Res)!";
        } else if (lower.includes("cedar rapids") || lower.includes("cedar")) {
            return "🏭 Cedar Rapids Flood Profile (Record 2008 Flood): The Cedar River crested 11ft above any historic record, flooding 1,300 city blocks. Build industrial levees around manufacturing plants (Ind) and water utilities (Wat)!";
        } else if (lower.includes("davenport")) {
            return "🏞️ Davenport Flood Profile (Record 2019 Flood): Davenport relies on temporary barriers and parks instead of concrete walls. In 2019, downtown flooded for 51 days. Deploy HESCO Sandbags along commercial storefronts!";
        } else if (lower.includes("greenville")) {
            return "⚓ Greenville Flood Profile (Great 1927 Flood): Site of the 1927 Mounds Landing levee breach that flooded 27,000 sq miles. Focus defenses on river port terminals (Ind) and agricultural storage silos!";
        } else if (lower.includes("st bernard") || lower.includes("st. bernard") || lower.includes("louisiana")) {
            return "🛡️ St. Bernard Parish Flood Profile (Hurricane Katrina 2005): 98% flooded by 2005 storm surge. Construct maximum-height Flood Walls along storm canals to protect regional Evacuation Shelters (Shel)!";
        }

        // Strategy & Action Queries
        if (lower.includes("build first") || lower.includes("what to build") || lower.includes("start")) {
            return "💡 In " + cityName + ", start by placing Flood Walls along low-lying riverbank tiles in front of Hospitals (Hos) and Water Facilities (Wat). Once vital services are protected, extend defenses to Residential neighborhoods.";
        } else if (lower.includes("critical") || lower.includes("priority") || lower.includes("structures") || lower.includes("save")) {
            return "🏰 Priority buildings in " + cityName + " include Hospitals (Hos), Emergency Stations (Fire/Pol), Water Infrastructure (Wat), and dense Residential housing (Res). Protect these first to keep your Safe Population at 100%!";
        } else if (lower.includes("budget") || lower.includes("money") || lower.includes("cost") || lower.includes("save budget")) {
            if (remBudget < 15000000) {
                return "💰 Low Budget Alert ($" + budgetMillions + "M remaining)! Avoid expensive high walls. Use targeted Sandbags ($150k) or Flood Insurance to protect critical structures within budget.";
            } else {
                return "💰 Healthy Budget ($" + budgetMillions + "M remaining)! Construct permanent Flood Walls along low riverbanks and elevate vulnerable residential structures.";
            }
        } else if (lower.includes("wall") || lower.includes("sandbag") || lower.includes("barrier") || lower.includes("hesco")) {
            return "🛡️ Flood Walls provide 100% elevation protection against high crests, while Sandbags are low-cost emergency barriers ($150k). Use Flood Walls along main river channels and Sandbags for quick perimeter defense!";
        } else if (lower.includes("wet") || lower.includes("dry") || lower.includes("proofing")) {
            return "🏠 Dry Floodproofing creates a waterproof seal around structure walls (1-4 ft). Wet Floodproofing allows water into lower utility areas to equalize pressure and reduce structural collapse risk.";
        } else if (lower.includes("risk") || lower.includes("grid") || lower.includes("purple") || lower.includes("yellow") || lower.includes("red")) {
            return "⚠️ Toggle the RISK button on your HUD to highlight vulnerable tiles. Red tiles indicate high flood hazard, yellow indicates moderate risk, and white is safe ground!";
        } else if (lower.includes("population") || lower.includes("people") || lower.includes("happy")) {
            return "😆 SAFE POPULATION shows the percentage of residents protected from floodwaters. Keep it at 100% by protecting high-density residential blocks (Res1, Res2, Res3)!";
        } else {
            return "🤖 I am monitoring " + cityName + " (Current Budget: $" + budgetMillions + "M). Check your Risk Overlay (purple grid) and place Flood Walls in front of low-elevation riverbank tiles!";
        }
    }

    // ── Worker bootstrap ───────────────────────────────────────────────────
    function initModel() {
        if (modelInitStarted) return;
        modelInitStarted = true;

        setInputEnabled(true);

        // On mobile devices, bypass heavy 350MB Web Worker WASM allocation to protect mobile RAM
        if (isMobileDevice) {
            console.log("Mobile device detected: using instant Local Location & Strategy Engine (0MB RAM).");
            return;
        }

        try {
            worker = new Worker('./js/aiTutorWorker.js?v=21', { type: 'module' });

            worker.addEventListener('message', (event) => {
                const { type, data, text, error } = event.data;

                if (type === 'ready') {
                    isWorkerReady = true;
                } else if (type === 'result') {
                    removeTypingIndicator();
                    appendBubbleMsg(text || generateLocalAIResponse("general"), "tutor");
                } else if (type === 'error') {
                    console.warn("Worker LLM load warning, using local engine:", error);
                    removeTypingIndicator();
                    isWorkerReady = false;
                    setInputEnabled(true);
                }
            });

            worker.postMessage({ type: 'init' });

        } catch (err) {
            console.warn("Web Worker not supported or blocked, using local rule engine:", err);
            setInputEnabled(true);
        }
    }

    // ── Send a message ──────────────────────────────────────────────────────
    function handleSend(text) {
        if (!text) return;

        appendBubbleMsg(text, "student");

        if (isWorkerReady && worker && !isMobileDevice) {
            const cityName  = document.getElementById("hud-city-name")?.textContent || "this city";
            const remBudget = (typeof window.totalAvailableMoney !== 'undefined')
                ? "$" + (window.totalAvailableMoney / 1e6).toFixed(1) + "M"
                : "$50M";

            const prompt = `<|im_start|>system
You are a friendly flood-management tutor for students playing FloodGame, a simulation set in ${cityName}. The player currently has ${remBudget} remaining. Answer in 2-3 clear sentences. Be educational and specific to flood prevention.<|im_end|>
<|im_start|>user
${text}<|im_end|>
<|im_start|>assistant
`;
            showTypingIndicator();
            worker.postMessage({ type: 'generate', prompt });
        } else {
            // Instant response from Local Location Engine (0ms, 0MB RAM)
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                const response = generateLocalAIResponse(text);
                appendBubbleMsg(response, "tutor");
            }, 300);
        }
    }

    // ── Expose globals ─────────────────────────────────────────────────────
    window.sendAIChatMessage = function () {
        const input = getInput();
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        handleSend(text);
    };

    window.sendAIQuickQuestion = function (question) {
        handleSend(question);
    };

    window.toggleAITutorBubble = function (forceState) {
        const bubble = document.getElementById("ai-tutor-bubble");
        if (!bubble) return;

        const isHidden  = bubble.classList.contains("is-hidden");
        const shouldShow = (typeof forceState !== "undefined") ? forceState : isHidden;

        if (shouldShow) {
            if (typeof updateAIAdvisorContent === "function") updateAIAdvisorContent();
            bubble.classList.remove("is-hidden");
            if (!modelInitStarted) initModel();
        } else {
            bubble.classList.add("is-hidden");
        }
    };

    // ── Keyboard listener ──────────────────────────────────────────────────
    document.addEventListener("DOMContentLoaded", () => {
        const input = getInput();
        if (input) {
            input.removeAttribute("onkeydown");
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") window.sendAIChatMessage();
            });
        }
    });
})();
