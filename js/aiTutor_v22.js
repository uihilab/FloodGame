// AI Tutor v25 — Instant Location & Strategy Engine (Universal 0ms / 0MB RAM)
(function () {
    // ── Chat Log API ────────────────────────────────────────────────────────
    // Change this URL to the lab server address once Samrat sets it up
    var API_BASE = window.location.hostname === "localhost"
        ? "http://localhost:3005"
        : "https://hydroinformatics.tulane.edu/api/floodgame";
    var LOG_API_URL = API_BASE + "/log";

    // One random session ID per page load — anonymous, no student info
    var SESSION_ID = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now();

    function getLocation() {
        return document.getElementById("hud-city-name")?.textContent?.trim() || "Unknown";
    }

    function logChat(role, message) {
        // Fire-and-forget — never blocks the game if the server is down
        fetch(LOG_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: SESSION_ID,
                location: getLocation(),
                role: role,
                message: message
            })
        }).catch(function () { /* server unavailable — silently ignore */ });
    }
    // ── DOM refs (bubble elements) ─────────────────────────────────────────
    function getInput() { return document.getElementById("ai-chat-input"); }
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

    function getLiveRemainingBudget() {
        if (typeof window.totalAvailableMoney === 'number' && !isNaN(window.totalAvailableMoney)) {
            return window.totalAvailableMoney;
        }
        const bEl = document.querySelector("#budget-progress");
        if (bEl && bEl.textContent) {
            const text = bEl.textContent.trim().replace("$", "");
            if (text.includes("M")) {
                const val = parseFloat(text.replace("M", ""));
                if (!isNaN(val)) return val * 1000000;
            } else {
                const val = parseFloat(text.replace(/,/g, ""));
                if (!isNaN(val)) return val;
            }
        }
        const factsEl = document.querySelectorAll("#critical-facts .has-text-right")[0];
        if (factsEl && factsEl.textContent) {
            const raw = factsEl.textContent.split("/")[0].replace(/[^0-9.]/g, "");
            const val = parseFloat(raw);
            if (!isNaN(val) && val > 0) return val;
        }
        return 50000000;
    }

    // ── Local Rule & Knowledge Response Engine (Instant 0ms Fallback) ─────────────
    function generateLocalAIResponse(text) {
        const cityName = document.getElementById("hud-city-name")?.textContent || "Iowa City";
        const remBudget = getLiveRemainingBudget();
        const budgetMillions = (remBudget / 1000000).toFixed(1);
        const lower = text.toLowerCase().trim();

        // 1. Check City / Location Queries (including typos like "des moon", "where are we")
        if (lower.includes("where are we") || lower.includes("what city") || lower.includes("which map") || lower.includes("current location") || lower.includes("tell me about")) {
            if (lower.includes("des moines") || lower.includes("des moon") || lower.includes("des moin") || cityName.toLowerCase().includes("des moines")) {
                return "️ You are managing Des Moines, Iowa — State Capital at the confluence of the Des Moines and Raccoon Rivers. Primary hazards include dual-river confluence surges threatening commercial centers (Com), police/fire stations (Pol/Fire), and water works plants (Wat).";
            } else if (lower.includes("cedar") || cityName.toLowerCase().includes("cedar rapids")) {
                return "You are managing Cedar Rapids, Iowa — a major industrial and food-processing hub on the Cedar River. Severe risk to industrial factories (Ind), water treatment utilities (Wat), and riverbank residential homes.";
            } else if (lower.includes("davenport") || cityName.toLowerCase().includes("davenport")) {
                return "️ You are managing Davenport, Iowa — famous for having no permanent river wall on its Mississippi River frontage. Relies on temporary HESCO barriers, sandbags, and green park buffers to absorb spring flood crests.";
            } else if (lower.includes("greenville") || cityName.toLowerCase().includes("greenville")) {
                return "You are managing Greenville, Mississippi — a historic Mississippi River Delta port town with low-lying alluvial topography vulnerable to extended high-water stages.";
            } else if (lower.includes("bernard") || cityName.toLowerCase().includes("st. bernard")) {
                return "You are managing St. Bernard Parish, Louisiana — coastal parish near New Orleans highly vulnerable to Category 3+ Gulf hurricane storm surges and canal breaches.";
            } else {
                return "You are currently playing on the " + cityName + "map (Remaining Budget: $" + budgetMillions + "M). View your location briefing card in the AI Guide for specific flood risks!";
            }
        }

        // Direct City Name Checks & History
        if (lower.includes("history") || lower.includes("past flood") || lower.includes("historically") || lower.includes("1993") || lower.includes("2008") || lower.includes("2019") || lower.includes("1927") || lower.includes("katrina")) {
            if (lower.includes("des moines") || lower.includes("des moon") || lower.includes("des moin") || cityName.toLowerCase().includes("des moines")) {
                return "Des Moines Flood History: During the Great Flood of 1993, both the Des Moines and Raccoon Rivers overtopped levees, submerging the municipal Water Works plant and leaving 250,000 residents without running water for 12 days.";
            } else if (lower.includes("cedar") || cityName.toLowerCase().includes("cedar rapids")) {
                return "Cedar Rapids Flood History: In June 2008, the Cedar River reached an unprecedented 31.12-foot crest (11 ft above record), submerging over 1,300 city blocks and displacing 18,000 residents.";
            } else if (lower.includes("iowa city") || cityName.toLowerCase().includes("iowa city")) {
                return "Iowa City Flood History: In June 2008, Coralville Reservoir overflowed its spillway, sending a 31.5-foot Iowa River crest that damaged over 20 University of Iowa campus buildings.";
            } else if (lower.includes("davenport") || cityName.toLowerCase().includes("davenport")) {
                return "Davenport Flood History: In May 2019, Davenport experienced a record 22.7-foot Mississippi River crest after temporary barriers breached, flooding riverfront commercial streets for 51 consecutive days.";
            } else if (lower.includes("greenville") || cityName.toLowerCase().includes("greenville")) {
                return "Greenville Flood History: Epicenter of the Great 1927 Mississippi River Flood. On April 21, 1927, the main levee breached near Greenville, flooding 27,000 sq miles up to 30ft deep and stranding 13,000 refugees on the levee for weeks.";
            } else if (lower.includes("bernard") || cityName.toLowerCase().includes("st. bernard")) {
                return "St. Bernard Parish Flood History: In August 2005 during Hurricane Katrina, Category 3+ storm surges breached MRGO and Industrial Canal levees, leaving 98% of St. Bernard Parish under 8–12 feet of water.";
            }
        }

        if (lower.includes("des moines") || lower.includes("des moon") || lower.includes("des moin")) {
            return "️ Des Moines Flood Profile (Great Flood of 1993): Vulnerable to dual-river flooding where the Des Moines & Raccoon Rivers meet. In 1993, the water treatment plant was submerged. Build Flood Walls along both rivers to protect Water Works (Wat) and Commercial banks (Com)!";
        } else if (lower.includes("iowa city")) {
            return "Iowa City Flood Profile (2008 Flood): Bisected by the Iowa River. In 2008, Coralville Reservoir spillover damaged $750M of university property. Protect University Hospitals (Hos), research labs, and dormitories (Res)!";
        } else if (lower.includes("cedar rapids") || lower.includes("cedar")) {
            return "Cedar Rapids Flood Profile (Record 2008 Flood): The Cedar River crested 11ft above any historic record, flooding 1,300 city blocks. Build industrial levees around manufacturing plants (Ind) and water utilities (Wat)!";
        } else if (lower.includes("davenport")) {
            return "️ Davenport Flood Profile (Record 2019 Flood): Davenport relies on temporary barriers and parks instead of concrete walls. In 2019, downtown flooded for 51 days. Deploy HESCO Sandbags along commercial storefronts!";
        } else if (lower.includes("greenville")) {
            return "Greenville Flood Profile (Great 1927 Flood): Site of the 1927 Mounds Landing levee breach that flooded 27,000 sq miles. Focus defenses on river port terminals (Ind) and agricultural storage silos!";
        } else if (lower.includes("st bernard") || lower.includes("st. bernard") || lower.includes("louisiana")) {
            return "️ St. Bernard Parish Flood Profile (Hurricane Katrina 2005): 98% flooded by 2005 storm surge. Construct maximum-height Flood Walls along storm canals to protect regional Evacuation Shelters (Shel)!";
        }

        // Strategy & Action Queries (Budget checked FIRST to avoid keyword collision)
        if (lower.includes("budget") || lower.includes("money") || lower.includes("cost") || lower.includes("save budget") || lower.includes("finance")) {
            if (remBudget < 15000000) {
                return "Low Budget Alert ($" + budgetMillions + "M remaining)! Avoid expensive continuous flood walls. Use low-cost Sandbags ($150k/tile) or Flood Insurance ($300k) to safeguard high-density blocks within budget.";
            } else {
                return "Budget Strategy ($" + budgetMillions + "M remaining): Allocate funds by building high-elevation Flood Walls ($1.2M) along primary riverfront channels first. Reserve 20% of budget for targeted Sandbags during sudden crest spikes!";
            }
        } else if (lower.includes("critical") || lower.includes("priority") || lower.includes("structures") || lower.includes("important") || lower.includes("focus on") || lower.includes("what to save") || lower.includes("protect") || lower.includes("saving") || lower.includes("save")) {
            if (cityName.toLowerCase().includes("des moines")) {
                return "Critical Buildings in Des Moines: Submerged Water Works plant (Wat), Downtown Commercial district (Com), and Police/Fire Stations. Protecting Water Works preserves safe drinking water for the city!";
            } else if (cityName.toLowerCase().includes("st. bernard")) {
                return "Critical Buildings in St. Bernard Parish: Regional Evacuation Shelters (Shel), Medical Centers (Hos), and Drainage Pumping Stations along storm surge canals.";
            } else if (cityName.toLowerCase().includes("cedar rapids")) {
                return "Critical Buildings in Cedar Rapids: Food Processing Facilities (Ind), Water Treatment Plants (Wat), and downtown Government / Commercial blocks.";
            } else {
                return "Critical Buildings in " + cityName + ": Hospitals (Hos), Water Infrastructure (Wat), Police/Fire Stations, and High-Density Residential blocks (Res3). Focus flood walls here first!";
            }
        } else if (lower.includes("build first") || lower.includes("what to build") || lower.includes("start") || lower.includes("recommendation")) {
            return "Action Plan for " + cityName + ": 1) Toggle RISK on your HUD to locate red/yellow danger tiles. 2) Place Flood Walls along low riverbanks. 3) Add Sandbags in front of Hospitals and Water Utilities!";
        } else if (lower.includes("wall") || lower.includes("sandbag") || lower.includes("barrier") || lower.includes("hesco")) {
            return "️ Flood Walls provide 100% elevation protection against high crests, while Sandbags are low-cost emergency barriers ($150k). Use Flood Walls along main river channels and Sandbags for quick perimeter defense!";
        } else if (lower.includes("wet") || lower.includes("dry") || lower.includes("proofing")) {
            return "Dry Floodproofing creates a waterproof seal around structure walls (1-4 ft). Wet Floodproofing allows water into lower utility areas to equalize pressure and reduce structural collapse risk.";
        } else if (lower.includes("risk") || lower.includes("grid") || lower.includes("yellow") || lower.includes("red")) {
            return "️ Toggle the RISK button on your HUD to highlight vulnerable tiles. Red tiles indicate high flood hazard, yellow indicates moderate risk, and white is safe ground!";
        } else if (lower.includes("population") || lower.includes("people") || lower.includes("happy")) {
            return "SAFE POPULATION shows the percentage of residents protected from floodwaters. Keep it at 100% by protecting high-density residential blocks (Res1, Res2, Res3)!";
        } else {
            return "I am monitoring " + cityName + "(Current Budget: $" + budgetMillions + "M). Check your Risk Overlay (red/yellow grid) and place Flood Walls in front of low-elevation riverbank tiles!";
        }
    }

    // ── Send a message ──────────────────────────────────────────────────────
    function handleSend(text) {
        if (!text) return;

        appendBubbleMsg(text, "student");
        logChat("user", text); // ← log student message
        showTypingIndicator();

        // Universal Instant Response (0ms delay, 0MB RAM, 100% reliability)
        setTimeout(() => {
            removeTypingIndicator();
            const response = generateLocalAIResponse(text);
            appendBubbleMsg(response, "tutor");
            logChat("assistant", response); // ← log AI response
        }, 250);
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

        const isHidden = bubble.classList.contains("is-hidden");
        const shouldShow = (typeof forceState !== "undefined") ? forceState : isHidden;

        if (shouldShow) {
            if (typeof updateAIAdvisorContent === "function") updateAIAdvisorContent();
            bubble.classList.remove("is-hidden");
            setInputEnabled(true);
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
        setInputEnabled(true);
    });
})();
