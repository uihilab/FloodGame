/**
 * FloodGame - Location-Specific AI Knowledge & Strategy Instructions
 * 
 * Includes detailed flood histories and maps city-specific flood hazards 
 * to the EXACT in-game building categories:
 * - Hospital (Hos) 🏥
 * - Fire Station (Fire) & Police Station (Pol) 🚒🚓
 * - Water & Utility Infrastructure (Wat) 🚰
 * - Industrial Facilities (Ind) 🏭
 * - Commercial & Financial Centers (Com, Bank, Htl) 🏢🏦
 * - Schools & Community Centers (School, Chu) 🏫
 * - Residential Housing (Res1, Res2, Res3) 🏠
 * - Emergency Flood Shelters (Shel1, Shel2, Shel3) 🛡️
 */

window.LOCATION_AI_KNOWLEDGE = {
    "iowa_city": {
        "cityName": "Iowa City, Iowa",
        "description": "Bisected by the Iowa River, Iowa City experienced catastrophic flooding during the 2008 Midwestern Floods when Coralville Reservoir overflowed, damaging over 20 University of Iowa campus buildings.",
        "floodHistory": "In June 2008, the Iowa River crested at a record 31.5 feet, causing over $750M in damage to University research labs, student housing, and medical facilities.",
        "priorityBuildings": [
            "🏥 Hospitals (Hos) & Medical Infrastructure",
            "🏫 Schools (School) & Educational Facilities",
            "🏢 Residential Neighborhoods (Res1, Res2, Res3)",
            "🛡️ Emergency Flood Shelters (Shel1, Shel2)"
        ],
        "keyRisks": "Iowa River rapid crests, flash flooding, and Coralville reservoir spillway surges.",
        "strategies": {
            "highBudget": "Construct permanent Flood Walls along low-lying Iowa River banks. Elevate critical Hospital (Hos) and School (School) structures.",
            "mediumBudget": "Deploy Sandbag lines around Residential (Res) blocks and convert paved riverfront lots into water-absorbing Parks.",
            "lowBudget": "Focus emergency Sandbag barriers strictly around Hospitals (Hos) and vital emergency access routes."
        }
    },
    "cedar_rapids": {
        "cityName": "Cedar Rapids, Iowa",
        "description": "A major industrial hub along the Cedar River, famous for the epic 2008 flood where the river crested 11 feet higher than any previously recorded flood in history.",
        "floodHistory": "In June 2008, the Cedar River reached an unprecedented 31.12-foot crest, inundating 10 square miles (over 1,300 city blocks), displacing 18,000 residents, and devastating major food-processing and industrial plants.",
        "priorityBuildings": [
            "🏭 Industrial Facilities (Ind)",
            "🚰 Water & Utility Infrastructure (Wat)",
            "🏢 Commercial & Business Centers (Com, Bank)",
            "🏠 Residential Neighborhoods (Res1, Res2, Res3)"
        ],
        "keyRisks": "Cedar River cresting after heavy regional rainstorms.",
        "strategies": {
            "highBudget": "Build reinforced industrial-grade Flood Levees and Flood Walls around Industrial (Ind) districts and Water Utility (Wat) plants.",
            "mediumBudget": "Elevate key Industrial (Ind) assets and relocate vulnerable riverbank Residential (Res) homes to high-ground zones.",
            "lowBudget": "Prioritize Sandbag defenses around Water Infrastructure (Wat) and electrical utility nodes."
        }
    },
    "des_moines": {
        "cityName": "Des Moines, Iowa",
        "description": "State Capital city situated at the confluence of the Des Moines and Raccoon Rivers. Infamous for the Great Flood of 1993 which submerged the municipal water plant.",
        "floodHistory": "During the Great Flood of 1993, both rivers overtopped levees, submerging the Water Works plant and leaving 250,000 residents without clean drinking water for 12 days.",
        "priorityBuildings": [
            "🏢 Commercial Centers & Financial Banks (Com, Bank)",
            "🚓 Police (Pol) & Fire Stations (Fire)",
            "🚰 Water Treatment Infrastructure (Wat)",
            "🏫 Schools & Community Centers (School, Chu)"
        ],
        "keyRisks": "Dual-river confluence surges during prolonged Midwestern rainstorms.",
        "strategies": {
            "highBudget": "Construct dual-river Flood Walls along the Des Moines and Raccoon River channels to protect Commercial (Com) and Police/Fire (Pol/Fire) centers.",
            "mediumBudget": "Reinforce existing earthen levees with Sandbag tops and expand wetland absorbing parks near the confluence.",
            "lowBudget": "Place emergency Sandbags around Water Infrastructure (Wat) facilities and Police/Fire stations."
        }
    },
    "davenport": {
        "cityName": "Davenport, Iowa",
        "description": "Famous for having no permanent concrete sea wall on its Mississippi River frontage, relying instead on green space parks, temporary HESCO barriers, and sandbags.",
        "floodHistory": "In May 2019, Davenport experienced a record 22.7-foot Mississippi River crest after temporary barriers breached downtown, inundating streets for 51 consecutive days.",
        "priorityBuildings": [
            "🏥 Regional Hospitals (Hos)",
            "🏢 Commercial Shops & Hotels (Com, Htl)",
            "🏠 Low-Elevation Residential Neighborhoods (Res1, Res2)",
            "🛡️ Emergency Flood Shelters (Shel1, Shel2)"
        ],
        "keyRisks": "Spring Mississippi River snowmelt crests and long-duration flood stages.",
        "strategies": {
            "highBudget": "Construct engineered Flood Walls along Commercial (Com) river blocks and relocate high-hazard riverfront Residential (Res) homes.",
            "mediumBudget": "Deploy temporary HESCO sandbag barriers along river roads and zone low-lying waterfront tiles as absorbing Parks.",
            "lowBudget": "Build targeted Sandbag barriers in front of Hospital (Hos) entrances and Commercial storefronts."
        }
    },
    "greenville": {
        "cityName": "Greenville, Mississippi",
        "description": "Historic Mississippi River Delta port town located at the epicenter of the catastrophic Great Mississippi River Flood of 1927.",
        "floodHistory": "On April 21, 1927, the main levee broke at Mounds Landing near Greenville, flooding 27,000 square miles up to 30 feet deep and stranding 13,000 refugees on the Greenville levee for weeks.",
        "priorityBuildings": [
            "🏭 Industrial & Cargo Depots (Ind)",
            "🚰 Water Infrastructure (Wat)",
            "🏠 Delta Residential Neighborhoods (Res1, Res2)",
            "🚒 Fire Stations (Fire) & Emergency Services"
        ],
        "keyRisks": "Extended Mississippi Delta river crest stages and plain inundation.",
        "strategies": {
            "highBudget": "Erect extended Flood Levees along Industrial (Ind) terminals and perimeter Water Infrastructure (Wat) hubs.",
            "mediumBudget": "Elevate Industrial (Ind) structures and convert low perimeter land into absorbing wetland buffers.",
            "lowBudget": "Deploy Sandbag rings around Residential (Res) neighborhood clusters and Fire (Fire) stations."
        }
    },
    "st_bernard": {
        "cityName": "St. Bernard Parish, Louisiana",
        "description": "Coastal parish adjacent to New Orleans, heavily impacted during Hurricane Katrina in 2005 when storm surge breached surrounding levees.",
        "floodHistory": "During Hurricane Katrina in August 2005, Category 3+ storm surges breached the MRGO and Industrial Canal levees, leaving 98% of St. Bernard Parish under 8–12 feet of water.",
        "priorityBuildings": [
            "🛡️ Hurricane Evacuation Shelters (Shel1, Shel2, Shel3)",
            "🚓 Police (Pol) & Fire Stations (Fire)",
            "🚰 Water Infrastructure & Pump Stations (Wat)",
            "🏠 Coastal Residential Communities (Res1, Res2)"
        ],
        "keyRisks": "Category 3+ Hurricane storm surges and storm canal breaches.",
        "strategies": {
            "highBudget": "Construct maximum-height Flood Walls along storm canals and heavily fortify Hurricane Shelters (Shel).",
            "mediumBudget": "Elevate Residential (Res) structures and fortify Water/Pump Infrastructure (Wat).",
            "lowBudget": "Sandbag perimeter fences around designated Hurricane Shelters (Shel) and vital Water Infrastructure (Wat)."
        }
    }
};

/**
 * Generates dynamic, budget-aware AI recommendations based on live game state.
 * @param {string} mapKey - e.g. "davenport", "iowa_city"
 * @param {number} remainingBudget - e.g. 45000000
 * @returns {object} Recommendation package
 */
window.getAIRecommendation = function(mapKey, remainingBudget) {
    const key = (mapKey || 'iowa_city').toLowerCase();
    const cityInfo = window.LOCATION_AI_KNOWLEDGE[key] || window.LOCATION_AI_KNOWLEDGE["iowa_city"];
    
    let budgetTier = "highBudget";
    let budgetStatusText = "High Budget Available";
    let budgetColor = "#48bb78"; // green
    
    if (remainingBudget < 10000000) {
        budgetTier = "lowBudget";
        budgetStatusText = "Low Budget Alert (< $10M)";
        budgetColor = "#f56565"; // red
    } else if (remainingBudget < 30000000) {
        budgetTier = "mediumBudget";
        budgetStatusText = "Moderate Budget Remaining ($10M - $30M)";
        budgetColor = "#ecc94b"; // yellow
    }
    
    return {
        cityName: cityInfo.cityName,
        description: cityInfo.description,
        floodHistory: cityInfo.floodHistory,
        priorityBuildings: cityInfo.priorityBuildings,
        keyRisks: cityInfo.keyRisks,
        budgetTier: budgetTier,
        budgetStatusText: budgetStatusText,
        budgetColor: budgetColor,
        strategy: cityInfo.strategies[budgetTier]
    };
};
