import json
import os
import random

# Ensure output directory exists
os.makedirs("/Users/campbellendries/Documents/GitHub/FloodGame/sources/maps/greenville", exist_ok=True)

ROWS = 50
COLS = 50

# We will layout vertical roads at columns 10, 20, 30, 40
# We will layout horizontal roads at rows 10, 20, 30
vertical_roads = {10, 20, 30, 40}
horizontal_roads = {10, 20, 30}

# Keep counters for ground tiles type instanceIds
ground_counters = {
    "water": 0,
    "parks": 0,
    "road": 0,
    "building": 0,
    "parking_lot": 0
}

# Keep counters for surface tiles type instanceIds
surface_counters = {
    "Res1": 0, "Res2": 0, "Res3": 0,
    "Com": 0, "Com2": 0, "Hos": 0,
    "Pol": 0, "Fire": 0, "Wat": 0,
    "Ind": 0, "Hll": 0, "Bank": 0,
    "Chu": 0, "Chse": 0, "Htl": 0,
    "Gas": 0
}

# Keep counters for surface tiles v2 type instanceIds
surface_v2_counters = {
    "road_h": 0,
    "road_v": 0,
    "road_c": 0,
    "tree": 0,
    "tree2": 0,
    "parking": 0
}

ground_grid = []
surface_grid = []
surface_v2_grid = []

# Random seed for reproducibility
random.seed(42)

for r in range(ROWS):
    ground_row = []
    surface_row = []
    surface_v2_row = []
    
    for c in range(COLS):
        # 1. Determine Tile Type and Elevation
        # River at rows 40 to 45
        if 40 <= r <= 45:
            g_type = "water"
            elev = 40
        # Levee at row 39
        elif r == 39:
            g_type = "parks"
            # Low elevation at breach point (cols 20 to 25)
            if 20 <= c <= 25:
                elev = 50
            else:
                elev = 75
        # Town at other rows
        else:
            elev = 50
            if c in vertical_roads or r in horizontal_roads:
                g_type = "road"
            else:
                # Distribute other tiles
                rand = random.random()
                if rand < 0.45:
                    g_type = "building"
                elif rand < 0.65:
                    g_type = "parking_lot"
                else:
                    g_type = "parks"
        
        # Ground Tile JSON
        g_id = ground_counters[g_type]
        ground_counters[g_type] += 1
        ground_row.append({
            "row": r,
            "column": c,
            "elevation": elev,
            "type": g_type,
            "instanceId": g_id,
            "floodWall": 0
        })
        
        # 2. Surface Tile JSON (Buildings and critical infrastructure)
        s_obj = 0
        # Only place on town building tiles
        if g_type == "building" and r < 39:
            # Critical buildings:
            if r == 8 and c == 25:
                s_type = "Hos"
                people = 150
            elif r == 18 and c == 35:
                s_type = "Pol"
                people = 30
            elif r == 28 and c == 15:
                s_type = "Fire"
                people = 20
            elif r == 5 and c == 15:
                s_type = "Wat"
                people = 10
            elif r == 35 and c == 25:
                s_type = "Hll"
                people = 50
            else:
                s_type = random.choice(["Res1", "Res2", "Res3", "Com", "Com2", "Bank", "Chu", "Htl", "Gas"])
                people = random.choice([5, 10, 20, 30, 40])
            
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
        
        # 3. Surface Tiles v2 JSON (Road models, trees, parking spaces)
        v2_obj = 0
        if r < 39:
            if g_type == "road":
                # Determine road model type
                is_vert = c in vertical_roads
                is_horiz = r in horizontal_roads
                if is_vert and is_horiz:
                    v2_type = "road_c"
                elif is_vert:
                    v2_type = "road_v"
                else:
                    v2_type = "road_h"
                
                v2_id = surface_v2_counters[v2_type]
                surface_v2_counters[v2_type] += 1
                v2_obj = {
                    "row": r,
                    "column": c,
                    "elevation": elev,
                    "type": v2_type,
                    "instanceId": v2_id,
                    "elevationStructure": 0,
                    "floodInsurance": 0,
                    "Dryfloodproofing": 0,
                    "Wetfloodproofing": 0,
                    "sandBag": 0
                }
            elif g_type == "parking_lot":
                v2_obj = {
                    "row": r,
                    "column": c,
                    "elevation": elev,
                    "type": "parking",
                    "instanceId": [],
                    "elevationStructure": 0,
                    "floodInsurance": 0,
                    "Dryfloodproofing": 0,
                    "Wetfloodproofing": 0,
                    "sandBag": 0
                }
            elif g_type == "parks" and random.random() < 0.4:
                v2_type = random.choice(["tree", "tree2"])
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

# Write output files
path_ground = "/Users/campbellendries/Documents/GitHub/FloodGame/sources/maps/greenville/GroundTiles.json"
path_surface = "/Users/campbellendries/Documents/GitHub/FloodGame/sources/maps/greenville/SurfaceTiles.json"
path_surface_v2 = "/Users/campbellendries/Documents/GitHub/FloodGame/sources/maps/greenville/SurfaceTiles_v2.json"

with open(path_ground, "w") as f:
    json.dump(ground_grid, f)

with open(path_surface, "w") as f:
    json.dump(surface_grid, f)

with open(path_surface_v2, "w") as f:
    json.dump(surface_v2_grid, f)

print("Greenville map tiles successfully generated!")
