"""
FloodGame Universal Map Generator
==================================
Generates a 50x50 game map for any real-world location using:
  - OpenStreetMap (Overpass API) for buildings, roads, waterways
  - Open-Elevation API for terrain height data
  - Nominatim for geocoding location names

Usage:
  python3 map_generator.py --location "Baton Rouge, LA" --name baton_rouge
  python3 map_generator.py --lat 30.4515 --lon -91.1871 --name baton_rouge
  python3 map_generator.py --location "Cedar Falls, IA" --name cedar_falls --rotation 15
"""

import json
import urllib.request
import urllib.parse
import os
import math
import random
import argparse
import time
import sys

ROWS = 50
COLS = 50
AREA_METERS = 850
ELEV_MIN_GAME = 40
ELEV_MAX_GAME = 80


def fetch_url(url, post_data=None, is_json=False, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'FloodGameMapGenerator/2.0 (https://github.com/uihilab/FloodGame)')
            req.add_header('Referer', 'https://github.com/uihilab/FloodGame')
            data = None
            if post_data:
                if is_json:
                    req.add_header('Content-Type', 'application/json')
                    data = post_data.encode('utf-8')
                else:
                    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
                    data = post_data.encode('utf-8')
            with urllib.request.urlopen(req, data=data, timeout=30) as r:
                return r.read().decode('utf-8')
        except Exception as e:
            print(f"   Attempt {attempt+1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(2)
    raise Exception(f"All {retries} attempts failed for {url}")


def geocode_location(location_name):
    print(f"   Geocoding '{location_name}'...")
    encoded = urllib.parse.quote(location_name)
    url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&limit=1"
    result = json.loads(fetch_url(url))
    if not result:
        raise Exception(f"Could not geocode: '{location_name}'")
    lat = float(result[0]['lat'])
    lon = float(result[0]['lon'])
    print(f"   Found: {result[0].get('display_name', location_name)}")
    print(f"   Center: {lat:.5f}, {lon:.5f}")
    return lat, lon


def compute_bbox(clat, clon, meters=AREA_METERS):
    lat_deg = meters / 111320
    lon_deg = meters / (111320 * math.cos(math.radians(clat)))
    return (clat - lat_deg/2, clat + lat_deg/2,
            clon - lon_deg/2, clon + lon_deg/2)


def fetch_elevations(lat_min, lat_max, lon_min, lon_max):
    print(f"   Querying {ROWS*COLS} elevation points...")
    locations = []
    for r in range(ROWS):
        lat = lat_max - (r / (ROWS-1)) * (lat_max - lat_min)
        for c in range(COLS):
            lon = lon_min + (c / (COLS-1)) * (lon_max - lon_min)
            locations.append({"latitude": round(lat,5), "longitude": round(lon,5)})
    url = "https://api.open-elevation.com/api/v1/lookup"
    body = json.dumps({"locations": locations})
    res = json.loads(fetch_url(url, body, is_json=True))
    elevations = [r["elevation"] for r in res["results"]]
    print(f"   Got {len(elevations)} points. Range: {min(elevations):.1f}m - {max(elevations):.1f}m")
    return elevations


ELEV_MIN_LAND = 46
ELEV_MAX_LAND = 72


def normalize_elevation(raw, emin, emax, dist_to_water=None):
    if emax - emin < 2.0 and dist_to_water is not None:
        if dist_to_water <= 5:
            return int(46 + (max(0, dist_to_water - 1) / 4.0) * 7)
        else:
            return int(56 + min(1.0, (dist_to_water - 5) / 10.0) * 14)
    if emax == emin:
        return 60
    norm = (raw - emin) / (emax - emin)
    return int(ELEV_MIN_LAND + norm * (ELEV_MAX_LAND - ELEV_MIN_LAND))


def fetch_osm(lat_min, lat_max, lon_min, lon_max):
    PAD = 0.003
    b = f"{lat_min-PAD},{lon_min-PAD},{lat_max+PAD},{lon_max+PAD}"
    query = f"""
[out:json];
(
  way["building"]({b});
  way["amenity"]({b});
  node["amenity"]({b});
  way["highway"]({b});
  way["waterway"]({b});
  way["natural"="water"]({b});
  way["natural"="wetland"]({b});
  relation["natural"="water"]({b});
  way["landuse"="reservoir"]({b});
  node["natural"="water"]({b});
);
out geom;
"""
    post_data = urllib.parse.urlencode({"data": query})
    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.openstreetmap.fr/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
    ]
    for url in endpoints:
        try:
            print(f"   Trying: {url.split('/')[2]}")
            result = json.loads(fetch_url(url, post_data))
            elements = result.get("elements", [])
            print(f"   Got {len(elements)} OSM features.")
            return elements
        except Exception as e:
            print(f"   Failed: {e}. Trying next...")
            time.sleep(1)
    raise Exception("All Overpass endpoints failed.")


def detect_street_angle(elements, clat):
    bearings = []
    for el in elements:
        tags = el.get("tags", {})
        if not tags.get("highway"):
            continue
        geom = el.get("geometry", [])
        for i in range(len(geom)-1):
            dlat = geom[i+1]["lat"] - geom[i]["lat"]
            dlon = (geom[i+1]["lon"] - geom[i]["lon"]) * math.cos(math.radians(clat))
            angle = math.degrees(math.atan2(dlon, dlat)) % 180
            bearings.append(angle)
    if not bearings:
        return 0.0
    bins = [0]*36
    for b in bearings:
        bins[int(b/5) % 36] += 1
    dominant = bins.index(max(bins)) * 5.0
    rotation = -(dominant % 90)
    if rotation < -45:
        rotation += 90
    print(f"   Dominant street angle: {dominant:.1f} deg -> rotation offset: {rotation:.1f} deg")
    return rotation


def make_rotator(clat, clon, angle_deg):
    angle_rad = math.radians(angle_deg)
    def rotate(lat, lon):
        dy = lat - clat
        dx = (lon - clon) * math.cos(math.radians(clat))
        rx = dx * math.cos(angle_rad) - dy * math.sin(angle_rad)
        ry = dx * math.sin(angle_rad) + dy * math.cos(angle_rad)
        return clat + ry, clon + rx / math.cos(math.radians(clat))
    return rotate


def get_grid_coord(lat, lon, rotate_fn, lat_min, lat_max, lon_min, lon_max):
    lat_r, lon_r = rotate_fn(lat, lon)
    r = int(round((lat_max - lat_r) / (lat_max - lat_min) * (ROWS-1)))
    c = int(round((lon_r - lon_min) / (lon_max - lon_min) * (COLS-1)))
    return max(0, min(ROWS-1, r)), max(0, min(COLS-1, c))


def detect_water_tiles(elements, rotate_fn, lat_min, lat_max, lon_min, lon_max):
    water_cells = set()
    for el in elements:
        tags = el.get("tags", {})
        is_water = (
            tags.get("waterway") in ("river","stream","canal","drain","ditch") or
            tags.get("natural") in ("water","wetland") or
            tags.get("landuse") == "reservoir"
        )
        if not is_water:
            continue
        geom = el.get("geometry", [])
        if not geom:
            if "lat" in el and "lon" in el:
                r, c = get_grid_coord(el["lat"], el["lon"], rotate_fn, lat_min, lat_max, lon_min, lon_max)
                water_cells.add((r, c))
            continue
        pts = [(pt["lat"], pt["lon"]) for pt in geom]
        for lat, lon in pts:
            r, c = get_grid_coord(lat, lon, rotate_fn, lat_min, lat_max, lon_min, lon_max)
            water_cells.add((r, c))
        # Widen rivers
        if tags.get("waterway") in ("river","canal"):
            extra = set()
            for (wr, wc) in list(water_cells):
                for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                    nr, nc = wr+dr, wc+dc
                    if 0 <= nr < ROWS and 0 <= nc < COLS:
                        extra.add((nr, nc))
            water_cells.update(extra)

    # Filter out small isolated water cells (like private pools or fountains) that create holes in the terrain mesh
    if water_cells:
        visited = set()
        filtered_water_cells = set()
        for cell in list(water_cells):
            if cell in visited:
                continue
            component = []
            queue = [cell]
            visited.add(cell)
            while queue:
                curr = queue.pop(0)
                component.append(curr)
                cr, cc = curr
                for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
                    nr, nc = cr+dr, cc+dc
                    neighbor = (nr, nc)
                    if neighbor in water_cells and neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
            # Only retain water bodies that span at least 6 cells (about 100 meters long)
            if len(component) >= 6:
                filtered_water_cells.update(component)
        water_cells = filtered_water_cells

    print(f"   Detected {len(water_cells)} water grid cells.")
    return water_cells


def bresenham_line(r0, c0, r1, c1):
    """Yield all grid cells on the line from (r0,c0) to (r1,c1)."""
    cells = []
    dr = abs(r1 - r0)
    dc = abs(c1 - c0)
    r, c = r0, c0
    sr = 1 if r1 > r0 else -1
    sc = 1 if c1 > c0 else -1
    if dc > dr:
        err = dc / 2
        while c != c1:
            cells.append((r, c))
            err -= dr
            if err < 0:
                r += sr
                err += dc
            c += sc
    else:
        err = dr / 2
        while r != r1:
            cells.append((r, c))
            err -= dc
            if err < 0:
                c += sc
                err += dr
            r += sr
    cells.append((r1, c1))
    return cells


def detect_flood_edge(water_cells):
    if not water_cells:
        return "west"
    avg_r = sum(r for r,c in water_cells) / len(water_cells)
    avg_c = sum(c for r,c in water_cells) / len(water_cells)
    scores = {"north": avg_r, "south": ROWS-avg_r, "west": avg_c, "east": COLS-avg_c}
    edge = min(scores, key=scores.get)
    print(f"   Auto flood source edge: {edge.upper()}")
    return edge


def classify_building(tags):
    b = tags.get("building","").lower()
    a = tags.get("amenity","").lower()
    s = tags.get("shop","").lower()
    o = tags.get("office","").lower()
    t = tags.get("tourism","").lower()
    if a == "hospital" or b == "hospital": return "Hos"
    if a == "police": return "Pol"
    if a == "fire_station": return "Fire"
    if a in ("place_of_worship",) or b in ("church","cathedral","chapel"): return "Chu"
    if a in ("school","university","college","kindergarten") or b == "school": return "School"
    if a == "bank" or b == "bank": return "Bank"
    if a == "fuel": return "Gas"
    if t == "hotel" or b == "hotel": return "Htl"
    if a in ("courthouse","townhall") or b in ("courthouse","townhall","civic","government"): return "Chse"
    if b in ("industrial","warehouse","manufactory"): return "Ind"
    if s or b == "retail": return "Com2"
    if o or b in ("commercial","office"): return "Com"
    if a == "water_works" or b == "water_tower": return "Wat"
    return None


def random_res(r, c):
    return "Res1" if (r+c)%3==0 else "Res2" if (r+c)%3==1 else "Res3"


PEOPLE_MAP = {
    "Hos":150,"Pol":30,"Fire":20,"School":80,"Com":25,"Com2":25,
    "Ind":40,"Wat":10,"Bank":15,"Gas":5,"Htl":60,"Chu":30,
    "Chse":20,"Res1":6,"Res2":6,"Res3":6,
}


def inject_critical_buildings(grid_class, building_types, building_counts, water_cells):
    required = {"Hos":None,"Pol":None,"Fire":None,"Wat":None}
    for r in range(ROWS):
        for c in range(COLS):
            bt = building_types[r][c]
            if bt in required and required[bt] is None:
                required[bt] = (r, c)

    def find_safe_tile(pr, pc):
        best, best_score = None, -1
        for r in range(2, ROWS-2):
            for c in range(2, COLS-2):
                if grid_class[r][c] == "parks" and (r,c) not in water_cells:
                    dist = min((abs(r-wr)+abs(c-wc)) for wr,wc in water_cells) if water_cells else 10
                    score = dist - abs(r-pr)*0.1 - abs(c-pc)*0.1
                    if score > best_score:
                        best_score, best = score, (r,c)
        return best

    placements = {"Hos":(10,35),"Pol":(25,30),"Fire":(35,20),"Wat":(5,40)}
    for btype, existing in required.items():
        if existing is None:
            pr, pc = placements[btype]
            tile = find_safe_tile(pr, pc)
            if tile:
                r, c = tile
                grid_class[r][c] = "building"
                building_types[r][c] = btype
                building_counts[btype] = building_counts.get(btype, 0) + 1
                print(f"   Injected {btype} at ({r},{c})")


def main():
    parser = argparse.ArgumentParser(description="FloodGame Universal Map Generator")
    parser.add_argument("--location", help="Location name (e.g. 'Baton Rouge, LA')")
    parser.add_argument("--lat", type=float)
    parser.add_argument("--lon", type=float)
    parser.add_argument("--name", required=True, help="Output folder name")
    parser.add_argument("--rotation", type=float, default=None,
                        help="Manual grid rotation in degrees (auto-detected if omitted)")
    args = parser.parse_args()

    if args.lat and args.lon:
        clat, clon = args.lat, args.lon
    elif args.location:
        print("\n[Step 1] Geocoding...")
        clat, clon = geocode_location(args.location)
    else:
        print("Error: provide --location or --lat/--lon")
        sys.exit(1)

    lat_min, lat_max, lon_min, lon_max = compute_bbox(clat, clon)
    print(f"   Bounding box: {lat_min:.5f}-{lat_max:.5f} lat, {lon_min:.5f}-{lon_max:.5f} lon")

    print("\n[Step 2] Fetching elevation data...")
    elevations = fetch_elevations(lat_min, lat_max, lon_min, lon_max)
    emin, emax = min(elevations), max(elevations)

    print("\n[Step 3] Fetching OpenStreetMap data...")
    try:
        elements = fetch_osm(lat_min, lat_max, lon_min, lon_max)
    except Exception as e:
        print(f"   OSM fetch failed ({e}). Proceeding with procedural street grid and building fallback...")
        elements = []

    print("\n[Step 4] Detecting street grid angle...")
    angle = args.rotation if args.rotation is not None else detect_street_angle(elements, clat)
    rotate_fn = make_rotator(clat, clon, angle)

    print("\n[Step 5] Detecting water bodies...")
    water_cells = detect_water_tiles(elements, rotate_fn, lat_min, lat_max, lon_min, lon_max)
    
    # If no natural water bodies are detected (landlocked city), inject a procedural flood source edge
    if not water_cells:
        print("   No natural water bodies detected. Procedurally injecting water source along the South boundary...")
        water_cells = set()
        for c in range(COLS):
            water_cells.add((ROWS - 1, c))
        flood_edge = "SOUTH"
    else:
        flood_edge = detect_flood_edge(water_cells)

    print("\n[Step 6] Classifying grid tiles...")
    grid_class = [["parks"]*COLS for _ in range(ROWS)]
    building_types = [[""]*COLS for _ in range(ROWS)]
    building_counts = {}

    for (r, c) in water_cells:
        grid_class[r][c] = "water"

    ROAD_TYPES = {"primary", "secondary", "tertiary", "residential", "trunk"}

    # Count road points per row/col to find dominant grid lines
    row_counts = [0] * ROWS
    col_counts = [0] * COLS
    for el in elements:
        tags = el.get("tags", {})
        if tags.get("highway") not in ROAD_TYPES:
            continue
        geom = el.get("geometry", [])
        for pt in geom:
            r, c = get_grid_coord(pt["lat"], pt["lon"], rotate_fn, lat_min, lat_max, lon_min, lon_max)
            row_counts[r] += 1
            col_counts[c] += 1

    # Find dominant grid-aligned rows and columns, keeping them spaced out
    def find_grid_streets(counts, min_spacing=6, threshold=5):
        streets = []
        for i in range(len(counts)):
            if counts[i] >= threshold:
                is_max = True
                for neighbor in range(max(0, i - min_spacing), min(len(counts), i + min_spacing + 1)):
                    if counts[neighbor] > counts[i]:
                        is_max = False
                        break
                if is_max and i not in streets:
                    if not any(abs(i - s) < min_spacing for s in streets):
                        streets.append(i)
        return streets

    selected_rows = find_grid_streets(row_counts, min_spacing=6, threshold=5)
    selected_cols = find_grid_streets(col_counts, min_spacing=6, threshold=5)

    # Fallback to standard backup grid if too few roads are found
    if len(selected_rows) < 2: selected_rows = [12, 24, 36, 44]
    if len(selected_cols) < 2: selected_cols = [12, 24, 36, 44]

    # Draw continuous grid streets
    for r in selected_rows:
        for c in range(COLS):
            if grid_class[r][c] not in ("water",):
                grid_class[r][c] = "road"
    for c in selected_cols:
        for r in range(ROWS):
            if grid_class[r][c] not in ("water",):
                grid_class[r][c] = "road"

    for el in elements:
        tags = el.get("tags", {})
        if not tags.get("building") and not tags.get("amenity"):
            continue
        geom = el.get("geometry", [])
        if geom:
            lat = sum(pt["lat"] for pt in geom) / len(geom)
            lon = sum(pt["lon"] for pt in geom) / len(geom)
        elif "lat" in el and "lon" in el:
            lat, lon = el["lat"], el["lon"]
        else:
            continue
        r, c = get_grid_coord(lat, lon, rotate_fn, lat_min, lat_max, lon_min, lon_max)
        if grid_class[r][c] not in ("water","road"):
            s_type = classify_building(tags) or random_res(r, c)
            grid_class[r][c] = "building"
            building_types[r][c] = s_type
            building_counts[s_type] = building_counts.get(s_type, 0) + 1

    print("\n[Step 7] Injecting critical buildings...")
    inject_critical_buildings(grid_class, building_types, building_counts, water_cells)

    print("\n[Step 8] Filling road-adjacent tiles...")
    random.seed(42)
    for r in range(ROWS):
        for c in range(COLS):
            if grid_class[r][c] != "parks":
                continue
            near_road = any(
                0 <= r+dr < ROWS and 0 <= c+dc < COLS and grid_class[r+dr][c+dc] == "road"
                for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]
            )
            if near_road and random.random() < 0.40:
                val = random.random()
                s_type = random_res(r,c) if val < 0.50 else ("Com" if val < 0.85 else "Com2")
                grid_class[r][c] = "building"
                building_types[r][c] = s_type
                building_counts[s_type] = building_counts.get(s_type, 0) + 1

    # Apply terrain smoothing and river slope blending
    print("\n[Step 8.5] Smoothing terrain mesh and blending river slopes...")
    for _ in range(3):
        smoothed = [0] * len(elevations)
        for r in range(ROWS):
            for c in range(COLS):
                val_sum, val_count = 0, 0
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < ROWS and 0 <= nc < COLS:
                            val_sum += elevations[nr * COLS + nc]
                            val_count += 1
                smoothed[r * COLS + c] = val_sum / val_count
        elevations = smoothed

    emin, emax = min(elevations), max(elevations)

    print(f"   Buildings: {building_counts}")

    print("\n[Step 9] Building output arrays...")
    from collections import deque
    dist_map = [[999] * COLS for _ in range(ROWS)]
    q = deque()
    for (wr, wc) in water_cells:
        dist_map[wr][wc] = 0
        q.append((wr, wc))
    while q:
        cr, cc = q.popleft()
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = cr + dr, cc + dc
            if 0 <= nr < ROWS and 0 <= nc < COLS and dist_map[nr][nc] > dist_map[cr][cc] + 1:
                dist_map[nr][nc] = dist_map[cr][cc] + 1
                q.append((nr, nc))

    ground_counters = {"water":0,"parks":0,"road":0,"building":0,"parking_lot":0}
    surface_counters = {k:0 for k in PEOPLE_MAP}
    ground_grid, surface_grid, surface_v2_grid = [], [], []

    for r in range(ROWS):
        ground_row, surface_row, v2_row = [], [], []
        for c in range(COLS):
            idx = r * COLS + c
            g_type = grid_class[r][c]
            if g_type == "water":
                elev = ELEV_MIN_GAME
            else:
                d_val = dist_map[r][c] if water_cells else None
                elev = normalize_elevation(elevations[idx], emin, emax, d_val)
            g_id = ground_counters.get(g_type, 0)
            ground_counters[g_type] = g_id + 1
            ground_row.append({"row":r,"column":c,"elevation":elev,"type":g_type,"instanceId":g_id,"floodWall":0})

            s_obj = 0
            if g_type == "building":
                s_type = building_types[r][c]
                people = PEOPLE_MAP.get(s_type, 6)
                s_id = surface_counters.get(s_type, 0)
                surface_counters[s_type] = s_id + 1
                s_obj = {"row":r,"column":c,"elevation":elev,"type":s_type,"instanceId":s_id,
                         "elevateStructure":0,"floodInsurance":0,"Dryfloodproofing":0,
                         "Wetfloodproofing":0,"sandBag":0,"peopleOnIt":people}
            surface_row.append(s_obj)

            v2_obj = 0
            if g_type == "road":
                has_h = (c>0 and grid_class[r][c-1]=="road") or (c<COLS-1 and grid_class[r][c+1]=="road")
                has_v = (r>0 and grid_class[r-1][c]=="road") or (r<ROWS-1 and grid_class[r+1][c]=="road")
                v2_type = "road_c" if (has_h and has_v) else "road_h" if has_v else "road_v"
                v2_obj = {"row":r,"column":c,"elevation":elev,"type":v2_type,"instanceId":[],
                          "elevationStructure":0,"floodInsurance":0,"Dryfloodproofing":0,
                          "Wetfloodproofing":0,"sandBag":0}
            elif g_type == "parks" and (r+c)%7 == 0:
                v2_type = "tree" if (r+c)%14==0 else "tree2"
                v2_obj = {"row":r,"column":c,"elevation":elev,"type":v2_type,"instanceId":[],
                          "elevationStructure":0,"floodInsurance":0,"Dryfloodproofing":0,
                          "Wetfloodproofing":0,"sandBag":0}
            v2_row.append(v2_obj)

        ground_grid.append(ground_row)
        surface_grid.append(surface_row)
        surface_v2_grid.append(v2_row)

    print("\n[Step 10] Writing files...")
    out_dir = f"./sources/maps/{args.name}"
    os.makedirs(out_dir, exist_ok=True)
    with open(f"{out_dir}/GroundTiles.json","w") as f: json.dump(ground_grid, f)
    with open(f"{out_dir}/SurfaceTiles.json","w") as f: json.dump(surface_grid, f)
    with open(f"{out_dir}/SurfaceTiles_v2.json","w") as f: json.dump(surface_v2_grid, f)
    with open(f"{out_dir}/meta.json","w") as f:
        json.dump({"name":args.name,"center_lat":clat,"center_lon":clon,
                   "rotation_deg":angle,"flood_edge":flood_edge,
                   "water_tile_count":len(water_cells),"building_counts":building_counts,
                   "location_query": args.location or f"{args.lat},{args.lon}"}, f, indent=2)

    print(f"\nDone! -> {out_dir}/")
    print(f"  Flood entry: {flood_edge.upper()}")
    print(f"  Water tiles: {len(water_cells)}  |  Buildings: {sum(building_counts.values())}")


if __name__ == "__main__":
    main()
