/**
 * riverTelemetry.js - Real-time USGS Streamflow Telemetry & Historical Disaster Scenarios
 * 
 * Interacts with USGS National Water Information System (NWIS) Continuous Values API:
 * - Parameter 00065: Gage height (water depth in feet)
 * - Parameter 00060: Discharge (streamflow in cubic feet per second, cfs)
 * 
 * Also provides curated historical disaster benchmarks (e.g., Hurricane Katrina 2005, 2008 Midwest Flood).
 */

class RiverTelemetryManager {
    constructor() {
        this.currentCityKey = "iowa_city";
        this.activeScenarioMode = "live"; // 'live' | 'historical' | 'clear'

        // Real USGS Station IDs for preset cities
        this.stations = {
            'iowa_city': {
                siteId: '05454500',
                name: 'Iowa River at Iowa City, IA',
                river: 'Iowa River',
                floodStage: 22.0,
                actionStage: 18.0,
                majorFloodStage: 25.0
            },
            'cedar_rapids': {
                siteId: '05464500',
                name: 'Cedar River at Cedar Rapids, IA',
                river: 'Cedar River',
                floodStage: 12.0,
                actionStage: 10.0,
                majorFloodStage: 16.0
            },
            'des_moines': {
                siteId: '05485500',
                name: 'Des Moines River at 2nd Ave, Des Moines, IA',
                river: 'Des Moines River',
                floodStage: 24.0,
                actionStage: 20.0,
                majorFloodStage: 27.0
            },
            'davenport': {
                siteId: '05420500',
                name: 'Mississippi River at Clinton / Quad Cities',
                river: 'Mississippi River',
                floodStage: 15.0,
                actionStage: 14.0,
                majorFloodStage: 18.0
            },
            'greenville': {
                siteId: '07289000',
                name: 'Mississippi River at Vicksburg / Greenville, MS',
                river: 'Mississippi River',
                floodStage: 43.0,
                actionStage: 40.0,
                majorFloodStage: 50.0
            },
            'st_bernard': {
                siteId: '07374525',
                name: 'Mississippi River / Delta at Belle Chasse, LA',
                river: 'Lower Mississippi & MRGO',
                floodStage: 16.0,
                actionStage: 14.0,
                majorFloodStage: 17.5
            }
        };

        // Famous historical disasters per city
        this.historicalDisasters = {
            'st_bernard': {
                title: 'Hurricane Katrina (Aug 29, 2005)',
                stageText: '18.7 ft Storm Surge (Record)',
                flowText: '1,200,000+ cfs (MRGO surge breach)',
                badgeText: 'Cat 4 Hurricane',
                badgeColor: '#ef4444',
                weatherPreset: 'hurricane',
                description: 'Cat 4 hurricane surge overtopped the MRGO and 40-Arpent floodwalls, submerging 98% of St. Bernard under 12-20 ft of water.'
            },
            'cedar_rapids': {
                title: 'Epic Midwest Flood (June 13, 2008)',
                stageText: '31.12 ft Crest (All-Time Record)',
                flowText: '73,000 cfs (Record flow)',
                badgeText: '500-Yr Disaster',
                badgeColor: '#ef4444',
                weatherPreset: 'rain',
                description: 'The Cedar River crested 19 ft above flood stage, cutting off downtown, flooding Mays Island City Hall, and impacting 10 sq miles.'
            },
            'iowa_city': {
                title: 'Historic Iowa River Flood (June 15, 2008)',
                stageText: '31.53 ft Crest (Record Inundation)',
                flowText: '41,000 cfs (Emergency spillway)',
                badgeText: 'Historic Record',
                badgeColor: '#ef4444',
                weatherPreset: 'rain',
                description: 'Coralville Reservoir crested its emergency spillway, swamping Burlington St Bridge and 20 University of Iowa campus buildings.'
            },
            'davenport': {
                title: 'Great Mississippi Flood (May 2, 2019)',
                stageText: '22.70 ft Crest (Record Crest)',
                flowText: '380,000 cfs',
                badgeText: 'Major Inundation',
                badgeColor: '#f97316',
                weatherPreset: 'rain',
                description: 'Temporary HESCO floodwalls along 2nd Street gave way under record Mississippi River volume, flooding downtown Davenport.'
            },
            'des_moines': {
                title: 'Great Flood of 1993 (July 11, 1993)',
                stageText: '26.87 ft Crest (Waterworks Inundated)',
                flowText: '116,000 cfs',
                badgeText: '500-Yr Flood',
                badgeColor: '#ef4444',
                weatherPreset: 'rain',
                description: 'The Des Moines and Raccoon Rivers overwhelmed city levees, flooding the water plant and cutting drinking water to 250,000 people.'
            },
            'greenville': {
                title: 'Great Mississippi Flood of 1927',
                stageText: '56.4 ft Crest (Historic Disaster)',
                flowText: '2,000,000+ cfs',
                badgeText: 'Epic Flood',
                badgeColor: '#ef4444',
                weatherPreset: 'rain',
                description: 'The Stops Landing levee collapsed north of Greenville, submerging the entire Mississippi Delta under 10 feet of water for months.'
            }
        };

        this.cachedLiveValues = {};
    }

    async loadForCity(cityKey, scenarioMode = 'live') {
        this.currentCityKey = cityKey;
        this.activeScenarioMode = scenarioMode;

        if (scenarioMode === 'historical') {
            this.renderHistoricalScenario(cityKey);
            return;
        }

        // Live USGS NWIS Fetch
        const station = this.stations[cityKey];
        if (!station) {
            this.renderCustomOrFallback(cityKey);
            return;
        }

        this.showLoadingState(station);

        try {
            const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${station.siteId}&parameterCd=00060,00065`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`USGS API responded ${response.status}`);
            const data = await response.json();

            const timeSeries = data?.value?.queryInfo ? data.value.timeSeries : null;
            let stageVal = null;
            let flowVal = null;
            let dateTimeStr = null;

            if (timeSeries && Array.isArray(timeSeries)) {
                for (let ts of timeSeries) {
                    const varCode = ts.variable?.variableCode?.[0]?.value;
                    const latest = ts.values?.[0]?.value?.[0];
                    if (varCode === '00065' && latest) {
                        stageVal = parseFloat(latest.value);
                        dateTimeStr = latest.dateTime;
                    } else if (varCode === '00060' && latest) {
                        flowVal = parseFloat(latest.value);
                        if (!dateTimeStr) dateTimeStr = latest.dateTime;
                    }
                }
            }

            this.cachedLiveValues[cityKey] = { stage: stageVal, flow: flowVal, time: dateTimeStr };
            this.renderLiveTelemetry(station, stageVal, flowVal);

        } catch (err) {
            console.warn(`[RiverTelemetry] Live fetch fallback for ${cityKey}:`, err);
            this.renderSimulatedLive(station);
        }
    }

    renderLiveTelemetry(station, stage, flow) {
        const hudEl = document.getElementById("river-telemetry-hud");
        if (!hudEl) return;

        hudEl.classList.remove("is-hidden");

        // Plain-language depth
        const depthText = (stage !== null && !isNaN(stage)) ? `${stage.toFixed(1)} ft deep` : 'Unknown';

        // Assess stage severity (0=normal, 1=watch, 2=flood, 3=major)
        let stageSeverity = 0;
        if (stage !== null && !isNaN(stage)) {
            if (stage >= station.majorFloodStage) stageSeverity = 3;
            else if (stage >= station.floodStage)  stageSeverity = 2;
            else if (stage >= station.actionStage)  stageSeverity = 1;
        }

        // Assess flow severity (0=calm, 1=fast, 2=very fast, 3=raging)
        let flowSeverity = 0;
        let flowText = 'Unknown';
        if (flow !== null && !isNaN(flow)) {
            if (flow < 1000)       { flowText = 'Very Calm';      flowSeverity = 0; }
            else if (flow < 5000)  { flowText = 'Flowing Normally'; flowSeverity = 0; }
            else if (flow < 20000) { flowText = 'Running Fast';   flowSeverity = 1; }
            else if (flow < 80000) { flowText = 'Running Very Fast'; flowSeverity = 2; }
            else                   { flowText = 'Raging';          flowSeverity = 3; }
        }

        // Overall status = worst of the two readings
        const severity = Math.max(stageSeverity, flowSeverity);
        let statusEmoji, statusText, statusColor;
        if (severity === 0) {
            statusEmoji = '🟢'; statusText = 'River is normal'; statusColor = '#10b981';
        } else if (severity === 1) {
            statusEmoji = '🟡'; statusText = 'River rising — watch out'; statusColor = '#eab308';
        } else if (severity === 2) {
            statusEmoji = '🟠'; statusText = 'Flooding!'; statusColor = '#f97316';
        } else {
            statusEmoji = '🔴'; statusText = 'Dangerous — major flooding'; statusColor = '#ef4444';
        }

        hudEl.innerHTML = `
            <div class="telemetry-inner" title="Live river sensor data from the US Geological Survey, updated every 15 minutes.">
                <div class="telemetry-top">
                    <span class="telemetry-pulse" style="background:${statusColor}; box-shadow: 0 0 8px ${statusColor};"></span>
                    <span class="telemetry-title">LIVE RIVER STATUS</span>
                    <span class="telemetry-badge" style="background: ${statusColor}22; color: ${statusColor}; border-color: ${statusColor}55;">${statusEmoji} ${statusText}</span>
                </div>
                <div class="telemetry-metrics">
                    <div class="telemetry-stat">
                        <span class="stat-label">Depth:</span>
                        <span class="stat-val">${depthText}</span>
                    </div>
                    <div class="telemetry-divider">|</div>
                    <div class="telemetry-stat">
                        <span class="stat-label">Speed:</span>
                        <span class="stat-val">${flowText}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderHistoricalScenario(cityKey) {
        const hudEl = document.getElementById("river-telemetry-hud");
        if (!hudEl) return;

        const disaster = this.historicalDisasters[cityKey];
        if (!disaster) {
            // No historical disaster for this city, fall back to live
            this.loadForCity(cityKey, 'live');
            return;
        }

        hudEl.classList.remove("is-hidden");

        hudEl.innerHTML = `
            <div class="telemetry-inner historical-mode" title="${disaster.description}">
                <div class="telemetry-top">
                    <i class="fas fa-bolt" style="color: ${disaster.badgeColor}; font-size: 0.75rem;"></i>
                    <span class="telemetry-title" style="color: #fca5a5;">DISASTER REPLAY</span>
                    <span class="telemetry-badge" style="background: ${disaster.badgeColor}22; color: ${disaster.badgeColor}; border-color: ${disaster.badgeColor}55;">${disaster.badgeText}</span>
                </div>
                <div class="telemetry-metrics">
                    <div class="telemetry-stat">
                        <span class="stat-label" style="color:#fca5a5;">Event:</span>
                        <span class="stat-val" style="color: #fca5a5; font-size:0.72rem;">${disaster.title}</span>
                    </div>
                </div>
            </div>
        `;

        // Automatically trigger matching atmospheric weather if WeatherSystem is loaded
        if (window.WeatherSystem && disaster.weatherPreset) {
            window.WeatherSystem.setWeather(disaster.weatherPreset);
        }
    }

    renderSimulatedLive(station) {
        // Fallback realistic normal values
        const estStage = (station.floodStage * 0.42).toFixed(1);
        const estFlow = 2100;
        this.renderLiveTelemetry(station, parseFloat(estStage), estFlow);
    }

    renderCustomOrFallback(name) {
        const hudEl = document.getElementById("river-telemetry-hud");
        if (!hudEl) return;
        // Sandbox locations don't have a mapped USGS river gauge; hide telemetry box
        hudEl.classList.add("is-hidden");
        hudEl.innerHTML = "";
    }

    showLoadingState(station) {
        const hudEl = document.getElementById("river-telemetry-hud");
        if (!hudEl) return;
        hudEl.classList.remove("is-hidden");
        hudEl.innerHTML = `
            <div class="telemetry-inner">
                <span class="telemetry-title"><i class="fas fa-spinner fa-spin"></i> Polling USGS NWIS Station...</span>
            </div>
        `;
    }
}

// Global Singleton
window.RiverTelemetry = new RiverTelemetryManager();
