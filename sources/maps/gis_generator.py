import json
import urllib.request
import urllib.parse
import os
import math
import random

# Center of downtown Greenville, MS
CLAT, CLON = 33.4065, -91.0610

# Bounding box dimensions (focused 850m x 850m area)
LAT_HALF_WIDTH = 0.0042
LON_HALF_WIDTH = 0.0042

LAT_MIN, LAT_MAX = CLAT - LAT_HALF_WIDTH, CLAT + LAT_HALF_WIDTH
LON_MIN, LON_MAX = CLON - LON_HALF_WIDTH, CLON + LON_HALF_WIDTH

ROWS = 50
COLS = 50

print("Starting Landmark-Mapped GIS Generation for Greenville...")

# Ensure output directory exists
os.makedirs("./sources/maps/greenville", exist_ok=True)

# Helper function to perform HTTP requests using python built-ins
def fetch_url(url, post_data=None, is_json=False):
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'FloodGameMapGenerator/1.0 (https://github.com/uihilab/FloodGame)')
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

# 1. Fetch Elevation Data (DEM) from Open-Elevation API
print("1. Querying Digital Elevation Model (DEM)...")
locations = []
for r in range(ROWS):
    lat = LAT_MAX - (r / (ROWS - 1)) * (LAT_MAX - LAT_MIN)
    for c in range(COLS):
        lon = LON_MIN + (c / (COLS - 1)) * (LON_MAX - LON_MIN)
        locations.append({"latitude": round(lat, 5), "longitude": round(lon, 5)})

url = "https://api.open-elevation.com/api/v1/lookup"
post_body = json.dumps({"locations": locations})
res = json.loads(fetch_url(url, post_body, is_json=True))
elevations = [result["elevation"] for result in res["results"]]
print(f"   Successfully fetched {len(elevations)} elevation data points.")

# 2. Fetch OpenStreetMap Features via Overpass API
# We query ways and nodes for both buildings and amenities
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

# Rotation angle to align Greenville's grid (rotated ~35 degrees counter-clockwise)
ANGLE_RAD = math.radians(-35)

def rotate_coords(lat, lon):
    dy = lat - CLAT
    dx = (lon - CLON) * math.cos(math.radians(CLAT))
    
    rx = dx * math.cos(ANGLE_RAD) - dy * math.sin(ANGLE_RAD)
    ry = dx * math.sin(ANGLE_RAD) + dy * math.cos(ANGLE_RAD)
    
    lat_r = CLAT + ry
    lon_r = CLON + rx / math.cos(math.radians(CLAT))
    return lat_r, lon_r

# Helper to find closest grid coordinate after rotation
def get_grid_coord(lat, lon):
    lat_r, lon_r = rotate_coords(lat, lon)
    r = int(round((LAT_MAX - lat_r) / (LAT_MAX - LAT_MIN) * (ROWS - 1)))
    c = int(round((lon_r - LON_MIN) / (LON_MAX - LON_MIN) * (COLS - 1)))
    return r, c

# 3. Classify tiles on the 50x50 grid
print("3. Generating structured, aligned GIS layout...")
grid_class = [["parks" for _ in range(COLS)] for _ in range(ROWS)]
building_types = [["" for _ in range(COLS)] for _ in range(ROWS)]

# 3a. Model the Mississippi River bank as a solid channel on the left (West)
for r in range(ROWS):
    river_col = 14
    for c in range(COLS):
        if c < river_col:
            grid_class[r][c] = "water"

# 3b. Model the protective Greenville Levee immediately along the river bank
for r in range(ROWS):
    river_col = 14
    grid_class[r][river_col] = "levee"
    grid_class[r][river_col + 1] = "levee"

# 3c. Lay out the main streets as straight vertical/horizontal lines aligned with our grid axes
vertical_streets = [20, 25, 30, 35, 42]  # Walnut St, Shelby St, Broadway St, Hinds St, Delesseps St
horizontal_streets = [15, 22, 30, 40]   # Main St, Washington Ave, Percy St, Clay St

for r in range(ROWS):
    for c in range(COLS):
        if c > 15:  # Only draw roads on the land side of the levee
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
        
    r, c = get_grid_coord(lat, lon)
    r = max(0, min(ROWS - 1, r))
    c = max(16, min(COLS - 1, c)) # Keep on land side of levee
    
    # If the tile is not a road/water/levee and doesn't already have a building
    if grid_class[r][c] == "parks":
        # Extract tags
        b_tag = tags.get("building", "").lower()
        a_tag = tags.get("amenity", "").lower()
        s_tag = tags.get("shop", "").lower()
        o_tag = tags.get("office", "").lower()
        t_tag = tags.get("tourism", "").lower()
        
        # Map tag to 3D game model type
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

# 3e. Force-place critical gameplay infrastructure at designated coordinates
# This ensures that key simulation components (Hospital, Police, Fire, Water Plant) are always present for gameplay mechanics.
grid_class[14][24] = "building"
building_types[14][24] = "Hos"
building_counts["Hos"] = building_counts.get("Hos", 0) + 1

grid_class[24][31] = "building"
building_types[24][31] = "Pol"
building_counts["Pol"] = building_counts.get("Pol", 0) + 1

grid_class[34][19] = "building"
building_types[34][19] = "Fire"
building_counts["Fire"] = building_counts.get("Fire", 0) + 1

grid_class[4][36] = "building"
building_types[4][36] = "Wat"
building_counts["Wat"] = building_counts.get("Wat", 0) + 1

# 3f. Structured Streetfront Infill (with modern shuffled office and home variety)
random.seed(42)
for r in range(ROWS):
    for c in range(COLS):
        if grid_class[r][c] == "parks":
            # Check if adjacent to road
            is_near_road = False
            for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < ROWS and 0 <= nc < COLS:
                    if grid_class[nr][nc] == "road":
                        is_near_road = True
                        break
            if is_near_road and random.random() < 0.40:
                grid_class[r][c] = "building"
                # Shuffe between standard houses, business offices and shops
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
        
        elev = int(50 + (raw_elev - 39) * 3)
        elev = max(40, min(80, elev))
        
        g_type = grid_class[r][c]
        
        if g_type == "levee":
            g_type = "parks"
            if 20 <= r <= 24:
                elev = 50  # Breach Crevasse
            else:
                elev = 72  # Solid Levee
                
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
        
        # Surface Placements (buildings, houses, critical structures)
        s_obj = 0
        if g_type == "building":
            s_type = building_types[r][c]
            
            # Setup people counts based on building usage
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
                people = 6 # Typical family size on residential house
                
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
            # Detect horizontal vs vertical direction from grid neighbors
            has_horiz = (c > 0 and grid_class[r][c-1] == "road") or (c < COLS-1 and grid_class[r][c+1] == "road")
            has_vert = (r > 0 and grid_class[r-1][c] == "road") or (r < ROWS-1 and grid_class[r+1][c] == "road")
            
            if has_horiz and has_vert:
                v2_type = "road_c"
            elif has_vert:
                v2_type = "road_h" # Swapped vertical -> horizontal mapping for legacy engine
            else:
                v2_type = "road_v" # Swapped horizontal -> vertical mapping for legacy engine
                
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
path_dir = "./sources/maps/greenville"
with open(f"{path_dir}/GroundTiles.json", "w") as f:
    json.dump(ground_grid, f)
with open(f"{path_dir}/SurfaceTiles.json", "w") as f:
    json.dump(surface_grid, f)
with open(f"{path_dir}/SurfaceTiles_v2.json", "w") as f:
    json.dump(surface_v2_grid, f)

print("GIS files successfully generated and saved to sources/maps/greenville!")
