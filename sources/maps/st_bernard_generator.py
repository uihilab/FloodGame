import json
import urllib.request
import urllib.parse
import os
import math
import random

# Tilted rectangular bounds defined by the user
# P1 (North-West), P2 (South-West), P3 (South-East), P4 (North-East)
P1_LAT, P1_LON = 29.94333, -89.99494
P2_LAT, P2_LON = 29.92362, -90.00249
P3_LAT, P3_LON = 29.92016, -89.98549
P4_LAT, P4_LON = 29.93671, -89.97803

# Min/Max bounding box to fetch raw OSM and elevation datasets
LAT_MIN = min(P1_LAT, P2_LAT, P3_LAT, P4_LAT)
LAT_MAX = max(P1_LAT, P2_LAT, P3_LAT, P4_LAT)
LON_MIN = min(P1_LON, P2_LON, P3_LON, P4_LON)
LON_MAX = max(P1_LON, P2_LON, P3_LON, P4_LON)

ROWS = 50
COLS = 50

print("Starting River-on-Left (180-deg rotated) GIS Generation for St. Bernard...")

# Ensure output directory exists
os.makedirs("./sources/maps/st_bernard", exist_ok=True)

# Helper function to perform HTTP requests using python built-ins
def fetch_url(url, post_data=None, is_json=False):
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'FloodGameMapGenerator/1.0 (campbell.endries@gmail.com)')
    req.add_header('Referer', 'https://github.com/uihilab/FloodGame')
    if post_data:
        if is_json:
            req.add_header('Content-Type', 'application/json')
            data = post_data.encode('utf-8')
        else:
            req.add_header('Content-Type', 'application/x-www-form-urlencoded')
            data = post_data.encode('utf-8')
    else:
        data = None
    with urllib.request.urlopen(req, data=data) as response:
        return response.read().decode('utf-8')

# Basis vectors of the rotated quadrilateral
# v_axis runs from P2 (South-West) to P1 (North-West) -> represents vertical grid axis (rows)
V_LAT = P1_LAT - P2_LAT
V_LON = P1_LON - P2_LON

# u_axis runs from P2 (South-West) to P3 (South-East) -> represents horizontal grid axis (columns)
U_LAT = P3_LAT - P2_LAT
U_LON = P3_LON - P2_LON

# Determinant of the coordinate transformation system
DET = U_LAT * V_LON - V_LAT * U_LON

# Function to map real-world lat/lon to grid row/col
# In this 180-degree rotation: river is on the left side of the map (col = 0), land on the right (col = 49)
def get_grid_coord(lat, lon):
    d_lat = lat - P2_LAT
    d_lon = lon - P2_LON
    
    # Solve system: P - P2 = u * u_axis + v * v_axis
    u = (d_lat * V_LON - d_lon * V_LAT) / DET
    v = (U_LAT * d_lon - U_LON * d_lat) / DET
    
    # Map u (0..1) to rows (P2 is row 0, P3 is row 49)
    # Map v (0..1) to columns (P2 is col 0, P1 is col 49)
    r = int(round(u * (ROWS - 1)))
    c = int(round(v * (COLS - 1)))
    return r, c, u, v

# 1. Fetch Elevation Data (DEM) from Open-Elevation API
print("1. Querying Digital Elevation Model (DEM)...")
locations = []
# Calculate grid coordinate lat/lons inside the custom rectangle
grid_latlons = []
for r in range(ROWS):
    u = r / (ROWS - 1)
    for c in range(COLS):
        v = c / (COLS - 1)
        # Reconstruct lat/lon
        lat = P2_LAT + u * U_LAT + v * V_LAT
        lon = P2_LON + u * U_LON + v * V_LON
        locations.append({"latitude": round(lat, 5), "longitude": round(lon, 5)})
        grid_latlons.append((lat, lon))

url = "https://api.open-elevation.com/api/v1/lookup"
post_body = json.dumps({"locations": locations})
res = json.loads(fetch_url(url, post_body, is_json=True))
elevations = [result["elevation"] for result in res["results"]]
print(f"   Successfully fetched {len(elevations)} elevation data points.")

# 2. Fetch OpenStreetMap Features via Overpass API
PAD = 0.003
print("2. Fetching OpenStreetMap vectors (Buildings, Amenities)...")
overpass_url = "https://overpass-api.de/api/interpreter"
overpass_query = f"""
[out:json];
(
  way["building"]({LAT_MIN-PAD},{LON_MIN-PAD},{LAT_MAX+PAD},{LON_MAX+PAD});
  way["amenity"]({LAT_MIN-PAD},{LON_MIN-PAD},{LAT_MAX+PAD},{LON_MAX+PAD});
  node["amenity"]({LAT_MIN-PAD},{LON_MIN-PAD},{LAT_MAX+PAD},{LON_MAX+PAD});
);
out geom;
"""
post_data = urllib.parse.urlencode({"data": overpass_query})
osm_data = None
overpass_urls = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter"
]
for url in overpass_urls:
    try:
        print(f"   Trying Overpass endpoint: {url}")
        osm_data = json.loads(fetch_url(url, post_data))
        break
    except Exception as e:
        print(f"   Endpoint {url} failed: {e}. Retrying fallback...")
        import time
        time.sleep(1.0)
        continue

if not osm_data:
    raise Exception("All Overpass API endpoints failed or timed out!")

elements = osm_data.get("elements", [])
print(f"   Successfully fetched {len(elements)} OSM features.")

# 3. Classify tiles on the 50x50 grid
print("3. Generating structured, aligned GIS layout...")
grid_class = [["parks" for _ in range(COLS)] for _ in range(ROWS)]
building_types = [["" for _ in range(COLS)] for _ in range(ROWS)]

# 3a. Model the Mississippi River bank mathematically (river on the left / West)
# River occupies columns 0 to 14
for r in range(ROWS):
    for c in range(COLS):
        if c <= 14:
            grid_class[r][c] = "water"

# 3b. Model the protective St. Bernard Levee running vertically next to the river
for r in range(ROWS):
    grid_class[r][14] = "levee"
    grid_class[r][15] = "levee"

# 3c. Lay out the main streets as straight vertical/horizontal lines aligned with our grid axes
# Parallel streets (running vertically as columns): St. Bernard Hwy, Chartres St, Royal St
vertical_streets = [21, 31, 41]
# Perpendicular streets (running horizontally as rows): Angela St, Mehle St, Friscoville Ave
horizontal_streets = [10, 20, 30, 40]

for r in range(ROWS):
    for c in range(COLS):
        if c >= 16:  # Only draw roads on the land side of the levee
            if c in vertical_streets or r in horizontal_streets:
                grid_class[r][c] = "road"

# 3d. Project real OSM buildings/amenities and match them to game models
building_counts = {}
for el in elements:
    tags = el.get("tags", {})
    if not tags:
        continue
    
    # Calculate coordinate
    if "geometry" in el and el["geometry"]:
        geom = el["geometry"]
        lat = sum(pt["lat"] for pt in geom) / len(geom)
        lon = sum(pt["lon"] for pt in geom) / len(geom)
    elif "lat" in el and "lon" in el:
        lat = el["lat"]
        lon = el["lon"]
    else:
        continue
        
    r, c, u, v = get_grid_coord(lat, lon)
    
    # Only place if it falls inside our custom rotated rectangle bounds
    if 0.0 <= u <= 1.0 and 0.0 <= v <= 1.0:
        r = max(0, min(ROWS - 1, r))
        c = max(0, min(COLS - 1, c))
        
        # Keep on land side of levee
        c = max(16, c)
        
        if grid_class[r][c] == "parks":
            b_tag = tags.get("building", "").lower()
            a_tag = tags.get("amenity", "").lower()
            s_tag = tags.get("shop", "").lower()
            o_tag = tags.get("office", "").lower()
            t_tag = tags.get("tourism", "").lower()
            
            s_type = "Res1"
            if a_tag == "hospital" or b_tag == "hospital":
                s_type = "Hos"
            elif a_tag == "police":
                s_type = "Pol"
            elif a_tag == "fire_station":
                s_type = "Fire"
            elif a_tag == "place_of_worship" or b_tag in ("church", "cathedral", "chapel"):
                s_type = "Chu"
            elif a_tag in ("school", "university", "college", "kindergarten") or b_tag == "school":
                s_type = "School"
            elif a_tag == "bank" or b_tag == "bank":
                s_type = "Bank"
            elif a_tag == "fuel" or b_tag == "fuel":
                s_type = "Gas"
            elif t_tag == "hotel" or b_tag == "hotel":
                s_type = "Htl"
            elif a_tag in ("courthouse", "townhall") or b_tag in ("courthouse", "townhall", "civic", "government"):
                s_type = "Chse"
            elif s_tag or b_tag == "retail":
                s_type = "Com2"
            elif o_tag or b_tag in ("commercial", "office"):
                s_type = "Com"
            elif b_tag in ("industrial", "warehouse", "manufactory"):
                s_type = "Ind"
            elif b_tag in ("house", "residential", "apartments", "detached", "duplex", "terrace"):
                s_type = "Res1" if (r+c)%3 == 0 else "Res2" if (r+c)%3 == 1 else "Res3"
            else:
                s_type = "Res1" if (r+c)%3 == 0 else "Res2" if (r+c)%3 == 1 else "Res3"
                
            grid_class[r][c] = "building"
            building_types[r][c] = s_type
            building_counts[s_type] = building_counts.get(s_type, 0) + 1

# 3e. Force-place critical gameplay infrastructure on the land side
grid_class[25][35] = "building"
building_types[25][35] = "Hos"
building_counts["Hos"] = building_counts.get("Hos", 0) + 1

grid_class[15][25] = "building"
building_types[15][25] = "Pol"
building_counts["Pol"] = building_counts.get("Pol", 0) + 1

grid_class[35][25] = "building"
building_types[35][25] = "Fire"
building_counts["Fire"] = building_counts.get("Fire", 0) + 1

grid_class[15][46] = "building"
building_types[15][46] = "Wat"
building_counts["Wat"] = building_counts.get("Wat", 0) + 1

# 3f. Structured Streetfront Infill (with modern shuffled office and home variety)
random.seed(42)
for r in range(ROWS):
    for c in range(COLS):
        if c >= 16 and grid_class[r][c] == "parks":
            is_near_road = False
            for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < ROWS and 0 <= nc < COLS:
                    if grid_class[nr][nc] == "road":
                        is_near_road = True
                        break
            if is_near_road and random.random() < 0.40:
                grid_class[r][c] = "building"
                val = random.random()
                if val < 0.50:
                    s_type = "Res1" if (r+c)%3 == 0 else "Res2" if (r+c)%3 == 1 else "Res3"
                elif val < 0.85:
                    s_type = "Com"
                else:
                    s_type = "Com2"
                building_types[r][c] = s_type
                building_counts[s_type] = building_counts.get(s_type, 0) + 1

print(f"   Landmark building counts: {building_counts}")

# 4. Build and format final files
print("4. Formatting data arrays for game engine...")
ground_grid = []
surface_grid = []
surface_v2_grid = []

# Counters for instanceIds
ground_counters = {"water": 0, "parks": 0, "road": 0, "building": 0, "parking_lot": 0}
surface_counters = {"Res1": 0, "Res2": 0, "Res3": 0, "Com": 0, "Com2": 0, "Hos": 0, "Pol": 0, "Fire": 0, "Wat": 0, "Hll": 0, "Gas": 0, "Bank": 0, "Chu": 0, "Htl": 0, "School": 0, "Ind": 0, "Chse": 0}
v2_counters = {"road_h": 0, "road_v": 0, "road_c": 0, "tree": 0, "tree2": 0, "parking": 0}

for r in range(ROWS):
    ground_row = []
    surface_row = []
    surface_v2_row = []
    
    for c in range(COLS):
        idx = r * COLS + c
        raw_elev = elevations[idx]
        
        # Scale elevation relative to sea level (0 meters)
        elev = int(50 + (raw_elev - 0) * 3)
        elev = max(40, min(80, elev))
        
        g_type = grid_class[r][c]
        
        if g_type == "levee":
            g_type = "parks"
            # Detonation crevasse point is modeled in the middle of the vertical levee (rows 20 to 24)
            if 20 <= r <= 24:
                elev = 50  
            else:
                elev = 72  
                
        if g_type == "water":
            elev = 40
            
        g_id = ground_counters.get(g_type, 0)
        ground_counters[g_type] = g_id + 1
        
        ground_row.append({
            "row": r,
            "column": c,
            "elevation": elev,
            "type": g_type,
            "instanceId": g_id,
            "floodWall": 0
        })
        
        # Surface Placements
        s_obj = 0
        if g_type == "building":
            s_type = building_types[r][c]
            
            if s_type == "Hos":
                people = 150
            elif s_type == "Pol":
                people = 30
            elif s_type == "Fire":
                people = 20
            elif s_type == "School":
                people = 80
            elif s_type in ("Com", "Com2"):
                people = 25
            else:
                people = 6
                
            s_id = surface_counters[s_type]
            surface_counters[s_type] += 1
            s_obj = {
                "row": r,
                "column": c,
                "elevation": elev,
                "type": s_type,
                "instanceId": s_id,
                "elevateStructure": 0,
                "floodInsurance": 0,
                "Dryfloodproofing": 0,
                "Wetfloodproofing": 0,
                "sandBag": 0,
                "peopleOnIt": people
            }
        surface_row.append(s_obj)
        
        # Surface v2 Placements (road models and trees)
        v2_obj = 0
        if g_type == "road":
            has_horiz = (c > 0 and grid_class[r][c-1] == "road") or (c < COLS-1 and grid_class[r][c+1] == "road")
            has_vert = (r > 0 and grid_class[r-1][c] == "road") or (r < ROWS-1 and grid_class[r+1][c] == "road")
            
            if has_horiz and has_vert:
                v2_type = "road_c"
            elif has_vert:
                v2_type = "road_h" # Swapped for legacy engine
            else:
                v2_type = "road_v" # Swapped for legacy engine
                
            v2_obj = {
                "row": r,
                "column": c,
                "elevation": elev,
                "type": v2_type,
                "instanceId": [],
                "elevationStructure": 0,
                "floodInsurance": 0,
                "Dryfloodproofing": 0,
                "Wetfloodproofing": 0,
                "sandBag": 0
            }
        elif g_type == "parks" and (r+c)%7 == 0:
            v2_type = "tree" if (r+c)%14 == 0 else "tree2"
            v2_obj = {
                "row": r,
                "column": c,
                "elevation": elev,
                "type": v2_type,
                "instanceId": [],
                "elevationStructure": 0,
                "floodInsurance": 0,
                "Dryfloodproofing": 0,
                "Wetfloodproofing": 0,
                "sandBag": 0
            }
            
        surface_v2_row.append(v2_obj)
        
    ground_grid.append(ground_row)
    surface_grid.append(surface_row)
    surface_v2_grid.append(surface_v2_row)

# Save files
path_dir = "./sources/maps/st_bernard"
with open(f"{path_dir}/GroundTiles.json", "w") as f:
    json.dump(ground_grid, f)
with open(f"{path_dir}/SurfaceTiles.json", "w") as f:
    json.dump(surface_grid, f)
with open(f"{path_dir}/SurfaceTiles_v2.json", "w") as f:
    json.dump(surface_v2_grid, f)

print("GIS files successfully generated and saved to sources/maps/st_bernard!")
