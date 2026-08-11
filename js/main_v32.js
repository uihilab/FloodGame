import { createTiles } from "./createWorldData.js";
import { createMeshes } from "./loadModels.js?v=32";
import * as THREE from "./../libs/threejs/three.module.js"
import CameraControls from "./../libs/camera-controls/camera-controls.module.js"
import * as holdEvent from "./../libs/camera-controls/hold-event.module.js";
import { LineMaterial } from './../libs/threejs/LineMaterial.js';
import { LineGeometry } from './../libs/threejs/LineGeometry.js';
import { GeometryUtils } from './../libs/threejs/GeometryUtils.js';
import { LineSegments2 } from './../libs/threejs/LineSegments2.js';
import {LineSegmentsGeometry} from './../libs/threejs/LineSegmentsGeometry.js';
import { MTLLoader } from './../libs/threejs/MTLLoader.js';
import { OBJLoader } from './../libs/threejs/OBJLoader.js';
import Stats from './../libs/threejs/stats.module.js';



async function main(opts, list_of_files, game_graphics_opt) {

    var camera, scene, renderer, stats, gui, spotLight;
    var container = document.getElementById("webgl-output");
    var cameraControls;
    const clock = new THREE.Clock();

    var groundTiles, surfaceTiles, surfaceTiles_v2, pos_of_objects, floodTiles, countMap, floodData;
    var minElevation, maxElevation;
    var totalCostAtTheStart;
    var meshDict, meshDictIndex, floodMesh;
    var borderSegments;
    var game_graphics_opt = game_graphics_opt;

    var frame1, frame2;

    var obj;
    var totalAvailableMoney = 50000000;
    var budgetGiven = 50000000;
    var expenses = 0;

    var initialBuilding, initialEffectedBuilding, initialCriticalBuilding, initialEffectedCriticalBuilding;
    var initialPeople, initialEffectedPeople;

    var tileSize = 100;
    var numberOfRows = 50;
    var numberOfColumns = 50;

    var transform = new THREE.Object3D();
    transform.rotation.order = 'YXZ';
    var instanceMatrix = new THREE.Matrix4();
    var matrix = new THREE.Matrix4();
    var vector3Scale = new THREE.Vector3(1, 1, 1);
    var vector3Position = new THREE.Vector3(1, 1, 1);

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(1, 1);
    var wireframe_1, wireframe_2, wireframe_3, wireframe_4;


    // var v1 = new THREE.Vector3(-4950, 0, -4950);
    // var v2 = new THREE.Vector3(4950, 0, 4950);
    var v1 = new THREE.Vector3(-2000, 0, -2000);
    var v2 = new THREE.Vector3(2000, 0, 2000);
    var bb = new THREE.Box3(v1, v2);

    // dictInstancedIdtoSurfacePosition dict contains instancedId of trees and roads and their corresponding array position.
    var dictInstancedIdtoSurfacePosition = {};
    dictInstancedIdtoSurfacePosition["road_v"] = {};
    dictInstancedIdtoSurfacePosition["road_h"] = {};
    dictInstancedIdtoSurfacePosition["road_c"] = {};
    dictInstancedIdtoSurfacePosition["tree"] = {};
    dictInstancedIdtoSurfacePosition["tree2"] = {};

    // dictSurfacePositiontoInstancedId dict contains array positions of trees and roads and their corresponding instancedIds.
    var dictSurfacePositiontoInstancedId = {};
    dictSurfacePositiontoInstancedId["road_v"] = {};
    dictSurfacePositiontoInstancedId["road_h"] = {};
    dictSurfacePositiontoInstancedId["road_c"] = {};
    dictSurfacePositiontoInstancedId["tree"] = {};
    dictSurfacePositiontoInstancedId["tree2"] = {};


    var zoom = 2;


    var isFlood = false;
    var doFlood = false;
    var ratioOfFlood = 0.0;
    var maxFloodActionStep = 100;
    var finishGame = 0;

    var selectedBuilding = {
        "isSelected": false,
        "instanceId": -1,
        "meshName": "None",
        "pos_x": -1,
        "pos_z": -1,
        "row": -1,
        "column": -1,
        "size": -1,
        "height": 0,
        "isMove": false,
        "peopleOnIt": 0,
    };

    var selectedTile = {
        "isSelected": false,
        "instanceId": -1,
        "meshName": "None",
        "elevation": 0,
        "type": "None",
        "pos_x": -1,
        "pos_z": -1,
        "row": -1,
        "column": -1,
    };


    var buildingMetaDict = await readExternalJSON("sources/buildingMetaDict.json");

    var mitigationMetaDataNew = await readExternalJSON("sources/mitigationMetaDataNew.json");

    var mitigationMetaData = await readExternalJSON("sources/mitigationMetaData.json");


    var mitigation_type_html_order = {
        1: 7,
        2: 2,
        3: 3,
        4: 4,
    };

    var mitigation_type_to_name = {
        1: "elevate_structure",
        2: "flood_wall",
        3: "sand_bag",
        4: "insurance",
    };


    

    var allMitigationsSelects = document.querySelectorAll(".mitigation-option select");
    var allCheckbox = document.querySelectorAll("[type='checkbox']");
    var allMitigationsCostTexts = document.querySelectorAll(".mitigation-option .mitigation-cost");

    var mitigation_opts = document.querySelectorAll(".mitigation-option");
    var tile_info = document.querySelector(".tile-info");
    var quick_fact_budget_panel = document.querySelectorAll(".quick-facts .card-content-left .card-content-item-val");
    var quick_fact_info_panel = document.querySelectorAll(".quick-facts .card-content-right .card-content-item-val");

    var elevateStructureSlider = document.querySelectorAll("[type='range']");

    var tileInformationPanelTabButtons = document.querySelectorAll(".tabs li");

    if (opts == 0){
        
        [groundTiles, surfaceTiles, surfaceTiles_v2, floodTiles, countMap] = await createTiles(list_of_files);
    
    }
    else{
        
        [groundTiles, surfaceTiles, surfaceTiles_v2, floodTiles, countMap] = await createAutomaticMapData(list_of_files);

    }

    // Procedurally add parking lots next to civic and commercial buildings in Greenville and St. Bernard
    if (list_of_files && list_of_files[0]) {
        var mapPath = list_of_files[0].toLowerCase();
        if (mapPath.includes("greenville") || mapPath.includes("st_bernard")) {
            if (!countMap["parking"]) countMap["parking"] = 0;
            if (!countMap["parking_lot"]) countMap["parking_lot"] = 0;
            
            for (var r = 0; r < numberOfRows; r++) {
                for (var c = 0; c < numberOfColumns; c++) {
                    var obj = surfaceTiles[r][c];
                    if (obj && obj !== 0 && ["Hos", "Pol", "School", "Fire", "Com"].includes(obj.type)) {
                        // Find empty neighbors to convert to parking
                        var dirs = [
                            [-1, 0], [1, 0], [0, -1], [0, 1]
                        ];
                        var convertedCount = 0;
                        for (var d = 0; d < dirs.length; d++) {
                            var nr = r + dirs[d][0];
                            var nc = c + dirs[d][1];
                            if (nr >= 0 && nr < numberOfRows && nc >= 0 && nc < numberOfColumns) {
                                if (surfaceTiles[nr][nc] === 0 && surfaceTiles_v2[nr][nc] === 0 && groundTiles[nr][nc].type === "parks") {
                                    // Convert to parking lot!
                                    groundTiles[nr][nc].type = "parking_lot";
                                    var rotY = 0;
                                    if (nr - r === -1) rotY = 0;
                                    else if (nr - r === 1) rotY = Math.PI;
                                    else if (nc - c === -1) rotY = -Math.PI / 2;
                                    else if (nc - c === 1) rotY = Math.PI / 2;
                                    surfaceTiles_v2[nr][nc] = { "type": "parking", "instanceId": [], "rotY": rotY };
                                    
                                    // Update counts
                                    countMap["parking"]++;
                                    countMap["parking_lot"]++;
                                    if (countMap["parks"]) countMap["parks"]--;
                                    
                                    convertedCount++;
                                    if (convertedCount >= 2) {
                                        break; // limit to 2 per building
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    [meshDict, meshDictIndex] = createMeshes(countMap);
    //console.log(meshDict);
    //console.log("meshDict is created!!!");
    
    

    init();
    //onWindowResize();
    animate();

    //console.log("Scene polycount:", renderer.info.render.triangles);
    //console.log("Active Drawcalls:", renderer.info.render.calls);
    //console.log("Textures in Memory", renderer.info.memory.textures);
    //console.log("Geometries in Memory", renderer.info.memory.geometries);
    //console.log("Rendere", renderer.info);

    function init() {

        CameraControls.install({ THREE: THREE });

        //Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color("#d2e4f6");
        // Camera set up
        var frustumSize = 1000;
        var a = $(container).width();
        var b = $(container).height();
        var aspect = a / b;
        camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 10000);
        camera.position.set(0 * a, a, -2 * a);
        camera.lookAt(scene.position);
        scene.add(camera);
        //var planeGeometry = new THREE.PlaneGeometry(20000, 20000, 1, 1);
        //var texture = new THREE.TextureLoader().load( '../extras/staticmap_v3.png' );
        //var planeMaterial = new THREE.MeshLambertMaterial( { map: texture } );
        //var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
        //var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        //plane.receiveShadow = true;
        // rotate and position the plane
        //plane.rotation.x = -0.5 * Math.PI;
        //plane.position.set(0,0,0);
        // add the plane to the scene
        //scene.add(plane);
        // Lights
        var light = new THREE.AmbientLight(0xd5e2f5, 0.55);
        scene.add(light);


        var dirLight = new THREE.DirectionalLight( 0xfffcf0, 1.15 );
        dirLight.position.set(2000, 3000, 1000);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 100;
        dirLight.shadow.camera.far = 10000;
        dirLight.shadow.camera.right = 4500;
        dirLight.shadow.camera.left = -4500;
        dirLight.shadow.camera.top = 4500;
        dirLight.shadow.camera.bottom = -4500;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.bias = -0.002;
        dirLight.shadow.radius = 4;
        scene.add(dirLight);



        // renderer

        renderer = new THREE.WebGLRenderer({ container });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize($(container).width(), $(container).height());
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = true;

        container.appendChild(renderer.domElement);

        stats = new Stats();
        container.appendChild( stats.dom );


        createWorld();
        createWireframes();

        cameraControls = new CameraControls(camera, renderer.domElement);
        cameraControls.setBoundary(bb);
        cameraControls.mouseButtons.left = CameraControls.ACTION.TRUCK;
        //cameraControls.mouseButtons.right = CameraControls.ACTION["NONE"];
        cameraControls.mouseButtons.wheel = CameraControls.ACTION["NONE"];
        //cameraControls.verticalDragToForward = false;
        //cameraControls.truckSpeed = 8.0;
        //cameraControls.zoom(0.25, false);
        cameraControls.rotate(-45 * THREE.Math.DEG2RAD, 0, true);

        cameraMovement();

        createBorders(numberOfRows, numberOfColumns, tileSize / 2);
        showEmptyTileGUI(false);
        showBuildingTileGUI(false);
        buttonGUISetUp();
        mitigationsActions();
        guiCostUpdate();
        totalCostAtTheStart = calculateTotalDamage();
        [initialBuilding, initialEffectedBuilding] = findNumberOfEffectedBuilding();
        [initialCriticalBuilding, initialEffectedCriticalBuilding] = findCriticalBuildingInformations();
        [initialPeople, initialEffectedPeople] = findNumberofEffectedPeople();

        // Update Main Game Panel
        uncheckAllMitigationStatus();

        //countdown( "countdown", 1000, 0 );
        //createBorderWireframe(50);

        window.addEventListener('resize', onWindowResize);

        renderer.domElement.addEventListener('mousemove', onMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onMouseClick, false);
        window.addEventListener('wheel', function(event) {
            if (event.deltaY < 0) { zoomInOut(1); }
            else {zoomInOut(0);}
        });
        updateGameProgressPanel();
        updateGoalsPanel();
        clickButton(0);
    };


    function getCornerElevation(r, c) {
        var sum = 0;
        var count = 0;
        
        // First check if there are any road or building cells adjacent to this corner
        var hasRoadOrBuilding = false;
        var rbSum = 0;
        var rbCount = 0;
        
        for (var dr = -1; dr <= 0; dr++) {
            for (var dc = -1; dc <= 0; dc++) {
                var nr = r + dr;
                var nc = c + dc;
                if (nr >= 0 && nr < numberOfRows && nc >= 0 && nc < numberOfColumns) {
                    var cell = groundTiles[nr][nc];
                    if (cell.type === "road" || cell.type === "building" || cell.type === "parking_lot") {
                        hasRoadOrBuilding = true;
                        rbSum += cell.elevation;
                        rbCount++;
                    }
                }
            }
        }
        
        if (hasRoadOrBuilding) {
            return rbSum / rbCount; // Grade/flatten the corner to match the road/building elevation only!
        }
        
        // If no road/building cells, do standard averaging of all neighbors (parks, water, etc.)
        for (var dr = -1; dr <= 0; dr++) {
            for (var dc = -1; dc <= 0; dc++) {
                var nr = r + dr;
                var nc = c + dc;
                if (nr >= 0 && nr < numberOfRows && nc >= 0 && nc < numberOfColumns) {
                    sum += groundTiles[nr][nc].elevation;
                    count++;
                }
            }
        }
        if (count > 0) return sum / count;
        if (r >= 0 && r < numberOfRows && c >= 0 && c < numberOfColumns) {
            return groundTiles[r][c].elevation;
        }
        return 0;
    }

    function createWorld() {

        var x, z;

        // Generate smooth discontinuous terrain geometries for land and water separately
        var geomLand = new THREE.BufferGeometry();
        var verticesLand = [];
        var indicesLand = [];
        var colorsLand = [];
        var landVertexIndex = 0;

        var geomWater = new THREE.BufferGeometry();
        var verticesWater = [];
        var indicesWater = [];
        var colorsWater = [];
        var waterVertexIndex = 0;

        // Multi-colored precision underplate to fill micro-gaps tile-by-tile
        var geomUnder = new THREE.BufferGeometry();
        var verticesUnder = [];
        var indicesUnder = [];
        var colorsUnder = [];
        var underVertexIndex = 0;

        // Find minimum elevation dynamically across the map
        var minElev = 0;
        for (var r_temp = 0; r_temp < numberOfRows; r_temp++) {
            for (var c_temp = 0; c_temp < numberOfColumns; c_temp++) {
                if (groundTiles[r_temp][c_temp].elevation < minElev) {
                    minElev = groundTiles[r_temp][c_temp].elevation;
                }
            }
        }
        var underY = minElev - 10.0;

        var groundColors = {
            "water": new THREE.Color("#0c2f47"),      // Deep blue
            "parks": new THREE.Color("#2a5e35"),      // Grass green
            "building": new THREE.Color("#3c4043"),   // Slate dark gray
            "parking_lot": new THREE.Color("#2a2c2e"),// Charcoal asphalt
            "road": new THREE.Color("#222426"),       // Dark asphalt
            "empty": new THREE.Color("#18191a")
        };

        for (var r = 0; r < numberOfRows; r++) {
            for (var c = 0; c < numberOfColumns; c++) {
                var obj = groundTiles[r][c];
                var [cx, cz] = calculatePosition(r, c);

                var x0 = cx - 50, z0 = cz - 50;
                var x1 = cx + 50, z1 = cz - 50;
                var x2 = cx - 50, z2 = cz + 50;
                var x3 = cx + 50, z3 = cz + 50;

                var y0, y1, y2, y3;

                if (obj.type == "water") {
                    y0 = getCornerElevation(r, c);
                    y1 = getCornerElevation(r + 1, c);
                    y2 = getCornerElevation(r, c + 1);
                    y3 = getCornerElevation(r + 1, c + 1);

                    verticesWater.push(x0, y0, z0);
                    verticesWater.push(x1, y1, z0);
                    verticesWater.push(x2, y2, z2);
                    verticesWater.push(x3, y3, z2);

                    var color = groundColors[obj.type] || groundColors["parks"];
                    for (var i = 0; i < 4; i++) {
                        colorsWater.push(color.r, color.g, color.b);
                    }

                    indicesWater.push(waterVertexIndex + 0, waterVertexIndex + 2, waterVertexIndex + 1);
                    indicesWater.push(waterVertexIndex + 1, waterVertexIndex + 2, waterVertexIndex + 3);

                    waterVertexIndex += 4;
                } else {
                    y0 = getCornerElevation(r, c);
                    y1 = getCornerElevation(r + 1, c);
                    y2 = getCornerElevation(r, c + 1);
                    y3 = getCornerElevation(r + 1, c + 1);

                    verticesLand.push(x0, y0, z0);
                    verticesLand.push(x1, y1, z0);
                    verticesLand.push(x2, y2, z2);
                    verticesLand.push(x3, y3, z2);

                    var color = groundColors[obj.type] || groundColors["parks"];
                    for (var i = 0; i < 4; i++) {
                        colorsLand.push(color.r, color.g, color.b);
                    }

                    indicesLand.push(landVertexIndex + 0, landVertexIndex + 2, landVertexIndex + 1);
                    indicesLand.push(landVertexIndex + 1, landVertexIndex + 2, landVertexIndex + 3);

                    landVertexIndex += 4;
                }

                // Build flat underplate quad at elevation underY (constant, so meet perfectly at boundaries)
                verticesUnder.push(x0, underY, z0);
                verticesUnder.push(x1, underY, z0);
                verticesUnder.push(x2, underY, z2);
                verticesUnder.push(x3, underY, z2);

                var underColor = (obj.type === "water") ? new THREE.Color("#0c2f47") : new THREE.Color("#16321b");
                for (var i = 0; i < 4; i++) {
                    colorsUnder.push(underColor.r, underColor.g, underColor.b);
                }

                indicesUnder.push(underVertexIndex + 0, underVertexIndex + 2, underVertexIndex + 1);
                indicesUnder.push(underVertexIndex + 1, underVertexIndex + 2, underVertexIndex + 3);

                underVertexIndex += 4;
            }
        }

        // 1. Create Land Mesh
        if (verticesLand.length > 0) {
            geomLand.setAttribute('position', new THREE.Float32BufferAttribute(verticesLand, 3));
            geomLand.setAttribute('color', new THREE.Float32BufferAttribute(colorsLand, 3));
            geomLand.setIndex(indicesLand);
            geomLand.computeVertexNormals();

            var matLand = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.85,
                metalness: 0.05,
                flatShading: false
            });

            var landMesh = new THREE.Mesh(geomLand, matLand);
            landMesh.receiveShadow = true;
            landMesh.castShadow = false;
            landMesh.name = "smoothTerrain";
            scene.add(landMesh);
        }

        // 2. Create Water Mesh
        if (verticesWater.length > 0) {
            geomWater.setAttribute('position', new THREE.Float32BufferAttribute(verticesWater, 3));
            geomWater.setAttribute('color', new THREE.Float32BufferAttribute(colorsWater, 3));
            geomWater.setIndex(indicesWater);
            geomWater.computeVertexNormals();

            var matWater = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.02,
                metalness: 0.65,
                opacity: 0.88,
                transparent: true,
                flatShading: false,
                emissive: new THREE.Color("#05223b"),
                emissiveIntensity: 0.45
            });

            var waterMesh = new THREE.Mesh(geomWater, matWater);
            waterMesh.receiveShadow = true;
            waterMesh.castShadow = false;
            waterMesh.name = "smoothTerrain";
            scene.add(waterMesh);
        }

        // 3. Create Precision Underplate Mesh to hide micro-gaps dynamically
        if (verticesUnder.length > 0) {
            geomUnder.setAttribute('position', new THREE.Float32BufferAttribute(verticesUnder, 3));
            geomUnder.setAttribute('color', new THREE.Float32BufferAttribute(colorsUnder, 3));
            geomUnder.setIndex(indicesUnder);
            geomUnder.computeVertexNormals();

            var matUnder = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.95,
                metalness: 0.05,
                flatShading: true
            });

            var underMesh = new THREE.Mesh(geomUnder, matUnder);
            underMesh.receiveShadow = true;
            underMesh.castShadow = false;
            underMesh.name = "smoothTerrain";
            scene.add(underMesh);
        }

        // Keep the old loop to record instance matrices but scale them to 0 so they don't render blocky boxes
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {

                obj = groundTiles[row][column];

                transform.scale.set(0, 0, 0);

                [x, z] = calculatePosition(row, column);
                if (obj.type == "water"){
                    transform.position.set(
                        x,
                        (obj.elevation / 2) + Math.random()*10,
                        z);

                }
                else{
                    transform.position.set(
                    x,
                    obj.elevation / 2,
                    z);

                }
                transform.updateMatrix();

                meshDict[obj.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
                groundTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
            };
        };

        for (var row = -1; row < 0; row++) {
            for (var column = -1; column < 55; column++) {

                //obj = groundTiles[row][column];

                transform.scale.set(tileSize, 100, tileSize);

                [x, z] = calculatePosition(row, column);

                transform.position.set(
                    x,
                    20,
                    z);
                transform.updateMatrix();

                meshDict["empty"].setMatrixAt(meshDictIndex["empty"][0]++, transform.matrix);
                //groundTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                //meshDict[obj.type].renderOrder = 0;
            };
        };

        for (var row = 0; row < 50; row++) {
            for (var column = -1; column < 0; column++) {

                //obj = groundTiles[row][column];

                transform.scale.set(tileSize, 100, tileSize);

                [x, z] = calculatePosition(row, column);

                transform.position.set(
                    x,
                    20,
                    z);
                transform.updateMatrix();

                meshDict["empty"].setMatrixAt(meshDictIndex["empty"][0]++, transform.matrix);
                //groundTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                //meshDict[obj.type].renderOrder = 0;
            };
        };




        transform.scale.set(1, 1, 1);


        for (var row = 0; row < numberOfRows; row++){
            for (var column = 0; column < numberOfColumns; column++){
                obj = surfaceTiles[row][column];
                if (obj != 0){
                    [x, z] = calculatePosition(obj.row, obj.column);
                    if (obj.type == "Res1" || obj.type == "Res2" || obj.type == "Res3" || obj.type == "Hos" || obj.type == "School" || obj.type == "Pol" || obj.type == "Com" || obj.type == "Fire"){
                    addObjects(x, z, groundTiles[row][column].elevation, obj.type, obj.row, obj.column)
                    }
                    else{
                    var offset = 0.5;
                    if (obj.type.startsWith("road") || obj.type === "parking") {
                        offset = 5.0;
                    }
                    transform.position.set(
                         x,
                        groundTiles[row][column].elevation + offset,
                        z);
                    transform.updateMatrix();
                    meshDict[obj.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
                    surfaceTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                    }
                }
            }
        }

        for (var row = 0; row < numberOfRows; row++){
            for (var column = 0; column < numberOfColumns; column++){
                obj = surfaceTiles_v2[row][column];
                // Procedurally populate empty grass cells with trees ONLY for St. Bernard and Greenville maps
                var isGreenvilleOrStBernard = false;
                if (typeof list_of_files !== "undefined" && list_of_files && list_of_files[0]) {
                    var path = list_of_files[0].toLowerCase();
                    if (path.includes("greenville") || path.includes("st_bernard")) {
                        isGreenvilleOrStBernard = true;
                    }
                }
                if (isGreenvilleOrStBernard && obj == 0 && groundTiles[row][column].type === "parks") {
                    var seed = (row * 79 + column * 97) % 100;
                    if (seed < 22) { // 22% chance to spawn a forest cluster on empty grass
                        var treeType = (seed % 2 === 0) ? "tree" : "tree2";
                        surfaceTiles_v2[row][column] = {
                            type: treeType,
                            instanceId: []
                        };
                        obj = surfaceTiles_v2[row][column];
                    }
                }
                if (obj != 0){
                    [x, z] = calculatePosition(row, column);
                    if (obj.type == "tree"){
                        dictSurfacePositiontoInstancedId["tree"][
                            [row, column]] = [];
                        var randomTreeNumber = getRndInteger(1, 5);
                        for (var i = 0; i < randomTreeNumber; i++){
                            // if (i == 0){
                            //     var x1 = x + getRandomArbitrary(10, 45);
                            //     var z1 = z + getRandomArbitrary(10, 45);
                            // }
                            // else if (i == 1){
                            //     var x1 = x + getRandomArbitrary(10, 45); 
                            //     var z1 = z - getRandomArbitrary(10, 45);
                            // }
                            // else if (i == 2){
                            //     var x1 = x - getRandomArbitrary(10, 45);
                            //     var z1 = z + getRandomArbitrary(10, 45);

                            // }
                            // else{
                            //     var x1 = x - getRandomArbitrary(10, 45);
                            //     var z1 = z - getRandomArbitrary(10, 45);
                            // }
                            var x1 = x + getRandomArbitrary(-45, 45);
                            var z1 = z + getRandomArbitrary(-45, 45);
                            var sc = getRandomArbitrary(0.7, 2.2);
                            transform.scale.set(sc, sc, sc);
                            transform.rotation.y = Math.random() * Math.PI * 2;
                            transform.position.set(
                                x1,
                                groundTiles[row][column].elevation,
                                z1);
                            transform.updateMatrix();
                            meshDict["tree"].setMatrixAt(meshDictIndex["tree"][0]++, transform.matrix);
                            transform.scale.set(1, 1, 1);
                            transform.rotation.set(0, 0, 0);
                            surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["tree"][0] - 1);
                            dictInstancedIdtoSurfacePosition["tree"][meshDictIndex["tree"][0] - 1] = [row, column];
                            dictSurfacePositiontoInstancedId["tree"][
                                [row, column]].push(meshDictIndex["tree"][0] - 1);
                        };
                    }
                    else if (obj.type == "tree2"){
                        dictSurfacePositiontoInstancedId["tree2"][
                            [row, column]] = [];
                        var randomTreeNumber = getRndInteger(1, 5);
                        for (var i = 0; i < randomTreeNumber; i++){
                            var x1 = x + getRandomArbitrary(-45, 45);
                            var z1 = z + getRandomArbitrary(-45, 45);
                            var sc = getRandomArbitrary(0.7, 2.2);
                            transform.scale.set(sc, sc, sc);
                            transform.rotation.y = Math.random() * Math.PI * 2;
                            transform.position.set(
                                x1,
                                groundTiles[row][column].elevation,
                                z1);
                            transform.updateMatrix();
                            meshDict["tree2"].setMatrixAt(meshDictIndex["tree2"][0]++, transform.matrix);
                            transform.scale.set(1, 1, 1);
                            transform.rotation.set(0, 0, 0);
                            surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["tree2"][0] - 1);
                            dictInstancedIdtoSurfacePosition["tree2"][meshDictIndex["tree2"][0] - 1] = [row, column];
                            dictSurfacePositiontoInstancedId["tree2"][
                                [row, column]].push(meshDictIndex["tree2"][0] - 1);
                        };
                    }
                    else if (obj.type == "road_v"){
                        dictSurfacePositiontoInstancedId["road_h"][
                            [row, column]] = [];

                        var y0 = getCornerElevation(row, column);
                        var y1 = getCornerElevation(row + 1, column);
                        var y2 = getCornerElevation(row, column + 1);
                        var y3 = getCornerElevation(row + 1, column + 1);

                        // Set rotation to flat (0, 0, 0)
                        transform.rotation.set(0, 0, 0);

                        // Position 1: ox = 0, oz = -25
                        var u1 = 0.5;
                        var v1 = (-25 + 50) / 100; // 0.25
                        var roadY1 = y0 * (1 - u1) * (1 - v1) + y1 * u1 * (1 - v1) + y2 * (1 - u1) * v1 + y3 * u1 * v1 + 0.15;

                        transform.position.set(
                            x,
                            roadY1,
                            z - 25);
                        transform.updateMatrix();
                        meshDict["road_h"].setMatrixAt(meshDictIndex["road_h"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["road_h"][0] - 1);
                        dictInstancedIdtoSurfacePosition["road_h"][meshDictIndex["road_h"][0] - 1] = [row, column];
                        dictSurfacePositiontoInstancedId["road_h"][
                            [row, column]
                        ].push(meshDictIndex["road_h"][0] - 1);

                        // Position 2: ox = 0, oz = 25
                        var u2 = 0.5;
                        var v2 = (25 + 50) / 100; // 0.75
                        var roadY2 = y0 * (1 - u2) * (1 - v2) + y1 * u2 * (1 - v2) + y2 * (1 - u2) * v2 + y3 * u2 * v2 + 0.15;

                        transform.position.set(
                            x,
                            roadY2,
                            z + 25);
                        transform.updateMatrix();
                        meshDict["road_h"].setMatrixAt(meshDictIndex["road_h"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["road_h"][0] - 1);
                        dictInstancedIdtoSurfacePosition["road_h"][meshDictIndex["road_h"][0] - 1] = [row, column];
                        dictSurfacePositiontoInstancedId["road_h"][
                            [row, column]
                        ].push(meshDictIndex["road_h"][0] - 1);

                        transform.rotation.set(0, 0, 0);
                    }
                    else if (obj.type == "road_h"){
                        dictSurfacePositiontoInstancedId["road_v"][
                            [row, column]] = [];

                        var y0 = getCornerElevation(row, column);
                        var y1 = getCornerElevation(row + 1, column);
                        var y2 = getCornerElevation(row, column + 1);
                        var y3 = getCornerElevation(row + 1, column + 1);

                        // Set rotation to flat (0, 0, 0)
                        transform.rotation.set(0, 0, 0);

                        // Position 1: ox = -25, oz = 0
                        var u1 = (-25 + 50) / 100; // 0.25
                        var v1 = 0.5;
                        var roadY1 = y0 * (1 - u1) * (1 - v1) + y1 * u1 * (1 - v1) + y2 * (1 - u1) * v1 + y3 * u1 * v1 + 0.15;

                        transform.position.set(
                            x - 25,
                            roadY1,
                            z);
                        transform.updateMatrix();
                        meshDict["road_v"].setMatrixAt(meshDictIndex["road_v"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["road_v"][0] - 1);
                        dictInstancedIdtoSurfacePosition["road_v"][meshDictIndex["road_v"][0] - 1] = [row, column];
                        dictSurfacePositiontoInstancedId["road_v"][
                            [row, column]
                        ].push(meshDictIndex["road_v"][0] - 1);

                        // Position 2: ox = 25, oz = 0
                        var u2 = (25 + 50) / 100; // 0.75
                        var v2 = 0.5;
                        var roadY2 = y0 * (1 - u2) * (1 - v2) + y1 * u2 * (1 - v2) + y2 * (1 - u2) * v2 + y3 * u2 * v2 + 0.15;

                        transform.position.set(
                            x + 25,
                            roadY2,
                            z);
                        transform.updateMatrix();
                        meshDict["road_v"].setMatrixAt(meshDictIndex["road_v"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["road_v"][0] - 1);
                        dictInstancedIdtoSurfacePosition["road_v"][meshDictIndex["road_v"][0] - 1] = [row, column];
                        dictSurfacePositiontoInstancedId["road_v"][
                            [row, column]
                        ].push(meshDictIndex["road_v"][0] - 1);

                        transform.rotation.set(0, 0, 0);
                    }
                    else if (obj.type == "road_c"){
                        var y0 = getCornerElevation(row, column);
                        var y1 = getCornerElevation(row + 1, column);
                        var y2 = getCornerElevation(row, column + 1);
                        var y3 = getCornerElevation(row + 1, column + 1);
                        var roadY = (y0 + y1 + y2 + y3) / 4 + 0.15;

                        // Set rotation to flat (0, 0, 0)
                        transform.rotation.set(0, 0, 0);

                        transform.position.set(
                            x,
                            roadY,
                            z);
                        transform.updateMatrix();
                        meshDict["road_c"].setMatrixAt(meshDictIndex["road_c"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column].instanceId = meshDictIndex["road_c"][0] - 1;
                        transform.rotation.set(0, 0, 0);
                    }
                    else if (obj.type == "parking"){
                        var y0 = getCornerElevation(row, column);
                        var y1 = getCornerElevation(row + 1, column);
                        var y2 = getCornerElevation(row, column + 1);
                        var y3 = getCornerElevation(row + 1, column + 1);
                        var roadY = (y0 + y1 + y2 + y3) / 4 + 0.15;

                        // Set rotation to flat Y-yaw only
                        transform.rotation.set(0, obj.rotY || 0, 0);

                        transform.position.set(
                            x,
                            roadY,
                            z);
                        transform.updateMatrix();

                        meshDict["parking"].setMatrixAt(meshDictIndex["parking"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column].instanceId = meshDictIndex["parking"][0] - 1;
                        transform.rotation.set(0, 0, 0);
                    }
                    else{
                        var y0 = getCornerElevation(row, column);
                        var y1 = getCornerElevation(row + 1, column);
                        var y2 = getCornerElevation(row, column + 1);
                        var y3 = getCornerElevation(row + 1, column + 1);
                        var roadY = (y0 + y1 + y2 + y3) / 4 + 0.15;

                        // Set rotation to flat (0, 0, 0)
                        transform.rotation.set(0, 0, 0);

                        transform.position.set(
                            x,
                            roadY,
                            z);
                        transform.updateMatrix();

                        meshDict[obj.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
                        surfaceTiles_v2[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                        transform.rotation.set(0, 0, 0);
                    };
                };
            };
        };

        transform.scale.set(0, 0, 0);
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (obj != 0) {
                    [x, z] = calculatePosition(row, column);
                    transform.position.set(
                        -10,
                        -10,
                        -10);
                    transform.updateMatrix();
                    meshDict[obj.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
                    floodTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                }
            };
        };

        for (name of Object.keys(meshDict)) {
            if (name != "flood") {
                scene.add(meshDict[name]);
            };
        };



    };


    function isNonInstancing(name){
        /*
            if object is added to scene with non-instancing method, returns true.
        */
        if (name == "Res1" || name == "Res2" || name == "Res3" || name == "Hos" || name == "School" || name == "Pol" || name == "Com" || name == "Fire"){
            return true;
        };
        return false;
    };


    function deleteObjectFromScene(externalID){
        /*
            This function takes externalID of object as input,
            then removes it from the scene.
        */
        var ob = scene.getObjectByProperty("externalID", externalID);
        removeObject3D(ob);
    };

    function changePositionofObject(externalID, x, y, z){
        /*
            This function takes externalID of object as input,
            then change the position of it on the scene.
        */

        var ob = scene.getObjectByProperty("externalID", externalID);
        ob.position.set(x, y, z);
    };


    function removeObject3D(object3D) {

        /*
            This function deletes any given object3D from the scene.
        */

        if (!(object3D instanceof THREE.Object3D)) return false;

        // for better memory management and performance
        if (object3D.geometry) object3D.geometry.dispose();

        if (object3D.material) {
            if (object3D.material instanceof Array) {
                // for better memory management and performance
                object3D.material.forEach(material => material.dispose());
            } else {
                // for better memory management and performance
                object3D.material.dispose();
            }
        }
        scene.remove(object3D); // the parent might be the scene or another Object3D, but it is sure to be removed this way
        return true;
    };


    function getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
    }

    function addFloodScene() {
        scene.add(meshDict["flood"]);
    };

    function createWireframes() {

        var helpGeo = new THREE.BoxBufferGeometry(tileSize * 0.98, tileSize * 0.98);
        helpGeo.rotateX(-Math.PI * 0.5)
        //helpGeo.rotateY(-45 * THREE.Math.DEG2RAD);
        /*
        var wireframegeo = new THREE.EdgesGeometry(helpGeo);
        var wireframemat = new THREE.LineBasicMaterial({ color: "#000000", linewidth: 4 });
        wireframe_1 = new THREE.LineSegments(wireframegeo, wireframemat);
        wireframe_1.name = "wireframe_1";
        wireframe_1.visible = false;
        wireframe_1.transparent = true;
        scene.add(wireframe_1);
        */
        var wireMate = new LineMaterial({vertexColors: true, linewidth: 4});
        wireMate.resolution.set(window.innerWidth, window.innerHeight);

        var wireGeo1 = new LineSegmentsGeometry();
        wireGeo1.setPositions(borderPosition(0, 0, findElevation(0, 0) + 2, 50).flat(1));
        wireGeo1.setColors([0, 0, 0, 0, 0, 0,0, 0, 0,0, 0, 0,0, 0, 0,0, 0, 0,0, 0, 0,0, 0, 0]);

        wireframe_1 = new LineSegments2(wireGeo1, wireMate);
        wireframe_1.name = "wireframe_1";
        wireframe_1.visible = false;
        scene.add(wireframe_1);

        /*
        var wireframemat_2 = new THREE.LineBasicMaterial({ color: "#cc0000", linewidth: 4 });
        wireframe_2 = new THREE.LineSegments(wireframegeo, wireframemat_2);
        wireframe_2.name = "wireframe_2";
        wireframe_2.visible = false;
        //wireframe_2.renderOrder = 10;
        scene.add(wireframe_2);
        */
        var wireGeo2 = new LineSegmentsGeometry();
        wireGeo2.setPositions(borderPosition(0, 0, findElevation(0, 0) + 2, 50).flat(1));
        wireGeo2.setColors([1, 0, 0, 1, 0, 0,1, 0, 0,1, 0, 0,1, 0, 0,1, 0, 0,1, 0, 0,1, 0, 0]);


        wireframe_2 = new LineSegments2(wireGeo2, wireMate);
        wireframe_2.name = "wireframe_2";
        wireframe_2.visible = false;
        scene.add(wireframe_2);

        
        var wireframemat_3 = new THREE.LineBasicMaterial({ color: "#800080", linewidth: 4 });
        /*
        wireframe_3 = new THREE.LineSegments(wireframegeo, wireframemat_3);
        wireframe_3.name = "wireframe_3";
        wireframe_3.visible = false;
        //wireframe_2.renderOrder = 10;
        scene.add(wireframe_3);
        */
        var wireGeo3 = new LineSegmentsGeometry();
        wireGeo3.setPositions(borderPosition(0, 0, findElevation(0, 0) + 2, 50).flat(1));
        wireGeo3.setColors([1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1]);

        wireframe_3 = new LineSegments2(wireGeo3, wireMate);
        wireframe_3.name = "wireframe_3";
        wireframe_3.visible = false;
        scene.add(wireframe_3);


        //var wireframemat_3 = new THREE.LineBasicMaterial( { color: "#800080", linewidth: 4 } );
        /*
        wireframe_4 = new THREE.LineSegments(wireframegeo, wireframemat_3);
        wireframe_4.name = "wireframe_4";
        wireframe_4.visible = false;
        //wireframe_2.renderOrder = 10;
        scene.add(wireframe_4);
        */

        wireframe_4 = new LineSegments2(wireGeo3, wireMate);
        wireframe_4.name = "wireframe_4";
        wireframe_4.visible = false;
        scene.add(wireframe_4);

    };


    function cameraMovement() {

        var KEYCODE = {
            W: 87,
            A: 65,
            S: 83,
            D: 68,
            ARROW_LEFT: 37,
            ARROW_UP: 38,
            ARROW_RIGHT: 39,
            ARROW_DOWN: 40,
        };

        var upKey = new holdEvent.KeyboardKeyHold(KEYCODE.ARROW_UP, 100);
        var leftKey = new holdEvent.KeyboardKeyHold(KEYCODE.ARROW_LEFT, 100);
        var downKey = new holdEvent.KeyboardKeyHold(KEYCODE.ARROW_DOWN, 100);
        var rightKey = new holdEvent.KeyboardKeyHold(KEYCODE.ARROW_RIGHT, 100);

        leftKey.addEventListener('holding', function(event) { cameraControls.truck(-1.5 * event.deltaTime, 0, false) });
        rightKey.addEventListener('holding', function(event) { cameraControls.truck(1.5 * event.deltaTime, 0, false) });
        upKey.addEventListener('holding', function(event) { cameraControls.forward(1.5 * event.deltaTime, false) });
        downKey.addEventListener('holding', function(event) { cameraControls.forward(-1.5 * event.deltaTime, false) });

    };


    function onWindowResize() {

        camera.aspect = document.getElementById("webgl-output").clientWidth / document.getElementById("webgl-output").clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( document.getElementById("webgl-output").clientWidth, document.getElementById("webgl-output").clientHeight );

    };


    function createFloodTile(row, column, elevation, type, water_level, flood_level, instanceId=0){
        /*
            This function create a floodTile on the background.
        */
        var tempTile;
        tempTile = {};
        tempTile.row = row;
        tempTile.column = column;
        tempTile.elevation = elevation;
        tempTile.type = type;
        tempTile.water_level = water_level;
        tempTile.flood_level = flood_level;
        tempTile.instanceId = instanceId;

        return tempTile;
    };


    function validCoord(row, column, n=numberOfRows, m=numberOfColumns){
        if (row < 0 || column < 0){
            return 0;
        };
        if (row >= n || column >= m){
            return 0
        };
        return 1;
    };




    function mitigationFloodLevelPrevention(row, column){

        /*
            This function checks all mitigation options on given tile which
            blocks the water and return the max flood level that it can block.
        */
        var result = 0;
        if (hasMitigationType(row, column, 1)){
            result = surfaceTiles[row][column].elevateStructure;
        }
        else if (hasMitigationType(row, column, 2)){
            result = groundTiles[row][column].floodWall;
        }
        else if (hasMitigationType(row, column, 3)){
            result = surfaceTiles[row][column].sandBag;
        }
        else{
            result = 0;
        }
        return result;
    };


    function maxAllowableFloodLevel(row, column){
        /*
            This function finds the maximum flood level that
            do not affect the give tile. Maximum flood level is calculated
            with summing elevation level and applied mitigation flood prevention value.
        */

        var result;

        result = groundTiles[row][column].elevation + mitigationFloodLevelPrevention(row, column);

        return result;
    };




    function updateFloodInformation(max_flood_level=55){
        /*
            This function updates the floodTiles based on the
            d4 floodfill algorithm.
            Input: 
                    max_flood_level: Maximum flood level on the scene
        */

        var visited, queue, x, y, protectionLevel;
        visited = [];
        queue = [];
        for (var i = 0; i < numberOfRows; i++){
            visited.push([]);
            for (var j = 0; j < numberOfColumns; j++){
                visited[i].push(0);
                floodTiles[i][j] = 0;
            };
        };
        for (var i = 0; i < numberOfRows; i++){
            for (var j = 0; j < numberOfColumns; j++){
                if (visited[i][j] == 0 && groundTiles[i][j].type == "water"){
                    
                    visited[i][j] = 1;
                    queue.push([i, j]);
                    while(queue.length > 0){
                        [x, y] = queue.shift();
                        protectionLevel = mitigationFloodLevelPrevention(x, y);
                        floodTiles[x][y] = createFloodTile(
                            x,
                            y,
                            groundTiles[x][y].elevation,
                            "flood",
                            Math.max(max_flood_level - maxAllowableFloodLevel(x, y), 0),
                            max_flood_level,
                            0);
                        if (validCoord(x + 1, y) == 1 && visited[x + 1][y] == 0 && maxAllowableFloodLevel(x + 1, y) < max_flood_level){
                            queue.push([x + 1, y]);
                            visited[x + 1][y] = 1;
                        };
                        if (validCoord(x - 1, y) == 1 && visited[x - 1][y] == 0 && maxAllowableFloodLevel(x - 1, y) < max_flood_level){
                            queue.push([x - 1, y]);
                            visited[x - 1][y] = 1;
                        };
                        if (validCoord(x, y + 1) == 1 && visited[x][y + 1] == 0 && maxAllowableFloodLevel(x, y + 1) < max_flood_level){
                            queue.push([x, y + 1]);
                            visited[x][y + 1] = 1;
                        };
                        if (validCoord(x, y - 1) == 1 && visited[x][y - 1] == 0 && maxAllowableFloodLevel(x, y - 1) < max_flood_level){
                            queue.push([x, y - 1]);
                            visited[x][y - 1] = 1;
                        };
                    }
                }
            }
        }
    
    };




    function nFormatter(num, digits) {
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" }
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        var item = lookup.slice().reverse().find(function(item) {
            return num >= item.value;
        });
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    };

    function guiCostUpdate() {
        /*
            This function updates the cost values shown on
            the main panel when a different option is selected.
        
        */

        // Add Building
        allMitigationsSelects[0].onchange = function() {
            allMitigationsCostTexts[0].textContent = "$" + nFormatter(mitigationMetaData[
                "add_structure"]["opts_values"][(allMitigationsSelects[0].value)]["cost"], 1);
        };

        // Change Tile
        allMitigationsSelects[1].onchange = function() {
            allMitigationsCostTexts[1].textContent = "$" + nFormatter(mitigationMetaData[
                "change_tile"]["opts_values"][(allMitigationsSelects[1].value)]["cost"], 1);
        };

        // Flood Wall
        allMitigationsSelects[2].onchange = function() {
            //allMitigationsCostTexts[2].textContent = "$" + mitigationMetaData[
                //"flood_wall"]["opts_values"][parseInt(allMitigationsSelects[2].value)]["cost"];

            if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                allMitigationsCostTexts[2].textContent = "$" + nFormatter(mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 1);
            }
            else{
                allMitigationsCostTexts[2].textContent = "$" + nFormatter(mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * 500, 1);
            };
        };

        //Sand Bag
        allMitigationsSelects[3].onchange = function() {
            //allMitigationsCostTexts[3].textContent = "$" + mitigationMetaData[
                //"sand_bag"]["opts_values"][parseInt(allMitigationsSelects[3].value)]["cost"];
            allMitigationsCostTexts[3].textContent = "$" + nFormatter(mitigationMetaDataNew["Sandbag"]["cost"][parseInt(allMitigationsSelects[3].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 1);
        };
        // Insurance

        // Relocate Structure

        // Remove Structure

        // Elevate Structure
        elevateStructureSlider[0].onchange = function(){
            allMitigationsCostTexts[7].textContent = "$" + nFormatter(mitigationMetaDataNew["ElevateStructure"]["cost"][parseInt(elevateStructureSlider[0].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Area"], 1);
        }
        // Wet Floodproofing
        allMitigationsSelects[4].onchange = function() {
            //allMitigationsCostTexts[3].textContent = "$" + mitigationMetaData[
                //"sand_bag"]["opts_values"][parseInt(allMitigationsSelects[3].value)]["cost"];
            allMitigationsCostTexts[8].textContent = "$" + nFormatter(mitigationMetaDataNew["Wetfloodproofing"]["cost"][parseInt(allMitigationsSelects[4].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 1);
        };

        // Dry Floodproofing
        allMitigationsSelects[5].onchange = function() {
            //allMitigationsCostTexts[3].textContent = "$" + mitigationMetaData[
                //"sand_bag"]["opts_values"][parseInt(allMitigationsSelects[3].value)]["cost"];
            allMitigationsCostTexts[9].textContent = "$" + nFormatter(mitigationMetaDataNew["Dryfloodproofing"]["cost"][parseInt(allMitigationsSelects[5].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 1);
        };
        allMitigationsSelects[6].onchange = function() {
            allMitigationsCostTexts[10].textContent = "$" + nFormatter(mitigationMetaData[
                "add_structure"]["opts_values"][(allMitigationsSelects[6].value)]["cost"], 1);
        };


    }


    function guiCostUpdateForNonOptionMitigations(){
        /*
            It updates the cost value on mitigation panel
            when a new building tile is selected.

        */
        // Insurance
        allMitigationsCostTexts[4].textContent = "$" + nFormatter(mitigationMetaDataNew["Insurance"]["cost"][surfaceTiles[selectedTile.row][selectedTile.column].type] * (buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column].type]["Str_val"] + buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column].type]["Cont_val"]), 1);
        // Relocate Structure
        allMitigationsCostTexts[5].textContent = "$" + nFormatter(mitigationMetaDataNew["Relocate"]["cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column].type]["Area"], 1);
        // Remove Structure
    };

    function guiCostUpdateOnTileChanged(){
        /*
            This function updates cost values of mitigation
            options when a tile clicked.
        */

        // Add Structure
        allMitigationsCostTexts[0].textContent = "$" + nFormatter(mitigationMetaData[
            "add_structure"]["opts_values"][(allMitigationsSelects[0].value)]["cost"], 1);

        // FloodWall
        if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[2].textContent = "$" + nFormatter(mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 1);
        }
        else{
            allMitigationsCostTexts[2].textContent = "$" + nFormatter(mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * 500, 1);
        }
        // SandBag
         if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[3].textContent = "$" + nFormatter(mitigationMetaDataNew["Sandbag"]["cost"][parseInt(allMitigationsSelects[3].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 1);
         }
        
         // Elevate Structure
         if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[7].textContent = "$" + nFormatter(mitigationMetaDataNew["ElevateStructure"]["cost"][parseInt(elevateStructureSlider[0].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Area"], 1);
         }

        // Wet Floodproofing
        if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[8].textContent = "$" + nFormatter(mitigationMetaDataNew["Wetfloodproofing"]["cost"][parseInt(allMitigationsSelects[4].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 1);
         }
        // Dry Floodproofing
        if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[9].textContent = "$" + nFormatter(mitigationMetaDataNew["Dryfloodproofing"]["cost"][parseInt(allMitigationsSelects[5].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 1);
         }
    };


    function updateGameProgressPanel(){
        /*
            This function updates the Game Progress Panel on Main Page.
        */

        var gameProgressPanel = document.querySelectorAll("#critical-facts .has-text-right");

        // -- Remaining Budget --
        gameProgressPanel[0].textContent = "$" + nFormatter((totalAvailableMoney).toFixed(0), 2) + "/" + nFormatter(50000000, 1);

        // -- Vulnerable Population --
        gameProgressPanel[1].textContent =  findNumberofEffectedPeople()[1] + "/" + findNumberofEffectedPeople()[0];

        // -- Avoided Loss --
        gameProgressPanel[2].textContent = "$" + nFormatter((totalCostAtTheStart - calculateTotalDamage()), 1);

        // -- Secured Building --
        gameProgressPanel[3].textContent = initialEffectedBuilding - findNumberOfEffectedBuilding()[1] + "/" + initialEffectedBuilding;

        // -- Shelter Capacity --
        gameProgressPanel[4].textContent = 0;

        // -- Secured Critical Buildings --
        var [t1, t2] = findCriticalBuildingInformations();
        gameProgressPanel[5].textContent = t2 + "/" + t1;

    }

    function updateGoalsPanel(){
        /*
            This function updates the Goals  Panel on Main Page.
        */
        var goalPanel = document.querySelectorAll("#goals .has-text-right");

        
        // -- Secure Critical Buildings --
        var [t1, t2] = findCriticalBuildingInformations();
        goalPanel[0].textContent = t2 + "/" + t1;
        if (t1 == t2){goalPanel[0].style.color = "green";}
        else{goalPanel[0].style.color = "red";}


        // -- Secured 100 People --
        var sc1 = initialEffectedPeople - findNumberofEffectedPeople()[1];
        if (sc1 > 100){
            goalPanel[1].textContent = sc1 + "/" + 100;
            goalPanel[1].style.color = "green";
        }else{
            goalPanel[1].textContent = sc1 + "/" + 100;
            goalPanel[1].style.color = "red";

        }
        // -- Apply FloodWall --
        var t = 0;
        for (var i = 0; i < numberOfRows; i++){
            for (var j = 0; j < numberOfColumns; j++){
                
                    if (groundTiles[i][j].floodWall > 0){
                        t += 1
                    }
                
            }
        };
        if (t > 0){
            goalPanel[2].textContent = "Achived";
            goalPanel[2].style.color = "green";
        }
        else{
            goalPanel[2].textContent = "In Progress";
            goalPanel[2].style.color = "red"
        };
        
        // -- Shelter 100 People -- 
        goalPanel[3].textContent = 0 / 100;
        goalPanel[3].style.color = "red";

    }


    function updateGameProgressReport() {
        /*
            This function updates the Game Report.
        */

        var gameReportAllResults = document.querySelectorAll("#modalDetails .game-reports .has-text-right");
        var indexOfResults = 0;
        // -- Social Vulnerability --
        // Affected People
        gameReportAllResults[indexOfResults].textContent = findNumberofEffectedPeople()[1];
        if (findNumberOfEffectedBuilding()[1] == 0){gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++

        // Sheltered Population
        gameReportAllResults[indexOfResults].textContent = 0
        indexOfResults++
        
        // Impacted Residential Buildings
        var [r1, r2] = findGeneralBuildingInformationsBasedOnType(isAResidentialBuilding);
        gameReportAllResults[indexOfResults].textContent = r2 + "/" + r1;
        if (r2 == 0){gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++
        
        // Secured People
        gameReportAllResults[indexOfResults].textContent = initialEffectedPeople - findNumberofEffectedPeople()[1] + "/" + initialEffectedPeople;
        if (initialEffectedPeople > findNumberofEffectedPeople()[1]){gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++
        
        // Secured Building
        gameReportAllResults[indexOfResults].textContent = initialEffectedBuilding - findNumberOfEffectedBuilding()[1] + "/" + initialEffectedBuilding;
        if (initialEffectedBuilding > findNumberOfEffectedBuilding()[1]){gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++
        
        // Impacted Commercial Buildings
        var [c1, c2] = findGeneralBuildingInformationsBasedOnType(isACommercialBuilding);
        gameReportAllResults[indexOfResults].textContent = c2 + "/" + c1;
        if (c2 == 0){gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++

        // // -- Critical Infrastructure Vulnerability --
        // // Water Treatment Facility
        // gameReportAllResults[indexOfResults].textContent = 0
        // indexOfResults++
        // // Police Station
        // gameReportAllResults[indexOfResults].textContent = 0
        // indexOfResults++
        // // Fire Station
        // gameReportAllResults[indexOfResults].textContent = 0
        // indexOfResults++
        // // Hospital
        // gameReportAllResults[indexOfResults].textContent = 0
        // indexOfResults++
        // // School
        // gameReportAllResults[indexOfResults].textContent = 0
        // indexOfResults++
        // // City Hall
        // gameReportAllResults[indexOfResults].textContent = 0
        // indexOfResults++
        // -- Economic Impact --
        // Remaining Budget
        gameReportAllResults[indexOfResults].textContent = "$" + nFormatter((totalAvailableMoney).toFixed(0), 1) + "/" + nFormatter(50000000, 1);
        indexOfResults++
        // Total Loss
        gameReportAllResults[indexOfResults].textContent = "$" + nFormatter(calculateTotalDamage(), 1);
        indexOfResults++
        // Impacted Industrial Buildings
        var [i1, i2] = findGeneralBuildingInformationsBasedOnType(isAIndustrialBuilding);
        gameReportAllResults[indexOfResults].textContent = i2 + "/" + i1;
        if (i2 == 0){gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++
        // Avoided Loss:
        gameReportAllResults[indexOfResults].textContent = "$" + nFormatter((totalCostAtTheStart - calculateTotalDamage()), 1);
        if (totalCostAtTheStart - calculateTotalDamage() > 0){gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++
        // Benefit Cost Ratio:
        gameReportAllResults[indexOfResults].textContent = Math.round(100 * (totalCostAtTheStart - calculateTotalDamage()) / Math.max(1, (budgetGiven - totalAvailableMoney))) + "%";
        if (totalCostAtTheStart - calculateTotalDamage() > Math.max(1, (budgetGiven - totalAvailableMoney))) {gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++
        // Applied Mitigation:
        gameReportAllResults[indexOfResults].textContent = findNumberOfMitigatedRegions();
        indexOfResults++


        // -- Goals --
        // Secure Critical Buildings
        var [t1, t2] = findCriticalBuildingInformations();
        gameReportAllResults[indexOfResults].textContent = t2 + "/" + t1;
        if (t1 == t2){gameReportAllResults[indexOfResults].style.color = "green";}
        else{gameReportAllResults[indexOfResults].style.color = "red";}
        indexOfResults++

        // Apply FloodWall
        var t = 0;
        for (var i = 0; i < numberOfRows; i++){
            for (var j = 0; j < numberOfColumns; j++){
                
                    if (groundTiles[i][j].floodWall > 0){
                        t += 1
                    }
                
            }
        };
        if (t > 0){
            gameReportAllResults[indexOfResults].textContent = "Achived";
            gameReportAllResults[indexOfResults].style.color = "green";
        }
        else{
            gameReportAllResults[indexOfResults].textContent = "In Progress";
            gameReportAllResults[indexOfResults].style.color = "red"
        };
        indexOfResults++

        // Secured 100 People
        var sc1 = initialEffectedPeople - findNumberofEffectedPeople()[1];
        if (sc1 > 100){
            gameReportAllResults[indexOfResults].textContent = sc1 + "/" + 100;
            gameReportAllResults[indexOfResults].style.color = "green";
        }else{
            gameReportAllResults[indexOfResults].textContent = sc1 + "/" + 100;
            gameReportAllResults[indexOfResults].style.color = "red";

        }
        indexOfResults++

        // Shelter 100 People
        gameReportAllResults[indexOfResults].textContent = 0 + "/" + 100;
        gameReportAllResults[indexOfResults].style.color = "red";
        indexOfResults++


        // var gameProgressMenu = document.querySelectorAll("#exampleModal .card_");

        // // --Critical Facts--
        // var factsLeftValues = gameProgressMenu[0].querySelectorAll(".card-content-left .card-content-item-val");
        // var factsRightValues = gameProgressMenu[0].querySelectorAll(".card-content-right .card-content-item-val");

        // // Secured Area
        // factsLeftValues[0].textContent = initialEffectedBuilding - findNumberOfEffectedBuilding()[1] + "/" + initialEffectedBuilding;

        // // Secured Building
        // factsLeftValues[1].textContent = initialEffectedCriticalBuilding - findCriticalBuildingInformations()[1] + "/" + findCriticalBuildingInformations()[0];

        // // Secured People
        // factsLeftValues[2].textContent = "$" + (totalCostAtTheStart - calculateTotalDamage());

        // // Secured Money
        // //factsLeftValues[3].textContent = calculateInsurancedMoney();

        // // Affected Area
        // factsRightValues[0].textContent = "$" + (totalAvailableMoney).toFixed(0);

        // // Affected Building
        // factsRightValues[1].textContent = findNumberOfEffectedBuilding()[1];

        // // Affected People
        // factsRightValues[2].textContent =  findNumberofEffectedPeople()[1] + "/" + findNumberofEffectedPeople()[0];

        // // Total Damage
        // //factsRightValues[3].textContent = calculateTotalDamage();


        // // --Goals--


        // // --Summary--
        // var summaryLeftValues = gameProgressMenu[2].querySelectorAll(".card-content-left .card-content-item-val");
        // var summaryRightValues = gameProgressMenu[2].querySelectorAll(".card-content-right .card-content-item-val");
        // // Remaining Budget
        // summaryLeftValues[0].textContent = "$" + (totalAvailableMoney).toFixed(0);
        // // Total Expenses
        // summaryLeftValues[1].textContent = "$" + (expenses).toFixed(0);
        // // Applied Mitigation
        // summaryRightValues[0].textContent = findNumberOfMitigatedRegions();
        // // Sheltered Population
        // summaryRightValues[1].textContent = findNumberOfShelteredPeople();

    };

    function floodAction() {


        var currentHeight, x, z;
        meshDictIndex["flood"][0] = 0;
        meshDictIndex["flood"][1] = [];
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {

                obj = floodTiles[row][column];
                if (obj != 0) {
                    meshDictIndex["flood"][0]++;
                    obj.instanceId = meshDictIndex["flood"][0] - 1;
                    currentHeight = obj.water_level * ratioOfFlood / maxFloodActionStep;

                    transform.scale.set(
                        tileSize, currentHeight / 2, tileSize);

                    [x, z] = calculatePosition(row, column);

                    transform.position.set(
                        x,
                        groundTiles[row][column].elevation + currentHeight / 4,
                        z);
                    transform.updateMatrix();

                    meshDict[obj.type].setMatrixAt(obj.instanceId, transform.matrix);

                    updateBorderHeight(row, column, groundTiles[row][column].elevation + (currentHeight / 2), numberOfRows, numberOfColumns);
                };

            };
        };

        meshDict["flood"].instanceMatrix.needsUpdate = true;
        ratioOfFlood++;


        if (ratioOfFlood == maxFloodActionStep + 1) {

            doFlood = false;
            ratioOfFlood = 0;

        };
    };

    function waterMovement(){
        /*
            This function change water levels to give water
            movement impression on the game.
        */

        var currentHeight, x, z;
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = groundTiles[row][column];
                if (obj.type == "water"){
                    [x, z] = calculatePosition(row, column);
                    transform.scale.set(tileSize, obj.elevation, tileSize);
                    transform.position.set(
                        x,
                        (groundTiles[row][column].elevation / 2) + Math.random() * (2 + 2) - 2,
                        z);
                    transform.updateMatrix();
                    meshDict[obj.type].setMatrixAt(obj.instanceId, transform.matrix);
                    
                };
            };
        };
        meshDict["water"].instanceMatrix.needsUpdate = true;
    };

    function clearwaterMovement(){
        /*
            This function change water levels to original values.
        */

        var currentHeight, x, z;
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = groundTiles[row][column];
                if (obj.type == "water"){
                    [x, z] = calculatePosition(row, column);
                    transform.scale.set(tileSize, obj.elevation, tileSize);
                    transform.position.set(
                        x,
                        groundTiles[row][column].elevation / 2,
                        z);
                    transform.updateMatrix();
                    meshDict[obj.type].setMatrixAt(obj.instanceId, transform.matrix);
                    
                };
            };
        };
        meshDict["water"].instanceMatrix.needsUpdate = true;
    };





    function isABuilding(type){
        if (["Res1", "Res2", "Res3", "Com", "Ind", "Hos", "Fire", "Pol", "School", "Bank", "Chu", "Chse", "Htl", "Com2", "Gas", "Hll"].includes(type)){ return true; }
        else { return false; };
    };


    function isACriticalBuilding(type){
        if (["Com", "Ind", "Hos", "Fire", "Pol", "School", "Bank", "Chu", "Chse", "Htl", "Com2", "Gas", "Hll"].includes(type)){ return true; }
        else { return false; };
    };

    function isAResidentialBuilding(type){
        if (["Res1", "Res2", "Res3"].includes(type)){ return true; }
        else { return false; };
    };

    function isAShelter(type){
        if (["Shel1", "Shel2", "Shel3"].includes(type)){ return true; }
        else { return false; };
    };


    function isACommercialBuilding(type){
        if (["Com"].includes(type)){ return true; }
        else { return false; };
    };

    function isAIndustrialBuilding(type){
        if (["Ind" ].includes(type)){ return true; }
        else { return false; };
    };

    function findNumberOfEffectedBuilding() {

        var totalBuilding = 0;
        var total = 0;
        updateFloodInformation();
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (isABuilding(surfaceTiles[row][column].type)){
                    total++;
                    if (obj !=0 ){
                        totalBuilding++;
                    };

                };
            };
        };

        return [total, totalBuilding];
    };


    function findCriticalBuildingInformations(){
        var totalBuilding = 0;
        var total = 0;
        updateFloodInformation();
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (isACriticalBuilding(surfaceTiles[row][column].type)){
                    total++;
                    if (obj != 0){
                        totalBuilding++;
                    };
                };
            };
        };

        return [total, totalBuilding];
    };


    function findGeneralBuildingInformationsBasedOnType(helperFunction){
        var totalBuilding = 0;
        var total = 0;
        updateFloodInformation();
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (helperFunction(surfaceTiles[row][column].type)){
                    total++;
                    if (obj != 0){
                        totalBuilding++;
                    };
                };
            };
        };

        return [total, totalBuilding];
    };


    function addObjects(x, z, elevation_value, type, row, column){
        var sizeOfObjects = {
            "Res1": 1,
            "Res2": 1.5,
            "Res3": 1.5,
            "Com": 1,
            "Hos": 1,
            "Pol": 1.5,
            "Fire": 1,
            "School": 1
        };

        var ox = 0, oz = 0, rotY = 0;
        var seed = (row * 17 + column * 31);
        if (type.startsWith("Res") || type === "Com") {
            ox = ((seed % 29) / 29 - 0.5) * 30; // +/- 15 units
            oz = ((seed % 37) / 37 - 0.5) * 30; // +/- 15 units
            rotY = (seed % 4) * (Math.PI / 2); // 0, 90, 180, 270 degrees
        } else {
            ox = ((seed % 13) / 13 - 0.5) * 10; // +/- 5 units
            oz = ((seed % 19) / 19 - 0.5) * 10; // +/- 5 units
            rotY = (seed % 4) * (Math.PI / 2); // 0, 90, 180, 270 degrees
        }

        new MTLLoader()
                .setPath( './models/modelExternal/' )
                .load( `${type}.mtl?v=15`, function ( materials ) {
                    materials.preload();
                    new OBJLoader()
                        .setMaterials( materials )
                        .setPath( './models/modelExternal/' )
                        .load( `${type}.obj?v=15`, function ( object ) {
                            object.externalID = `${row}_${column}`;
                            object.name = type;
                            object.traverse( function ( child ) {
                                if ( child.isMesh ) {
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                    if ( child.material ) {
                                        var processMaterial = function(mat) {
                                            var newMat = new THREE.MeshStandardMaterial({
                                                color: mat.color,
                                                roughness: 0.65,
                                                metalness: 0.1,
                                                name: mat.name
                                            });
                                            if (mat.name && mat.name.toLowerCase().includes("glass")) {
                                                newMat.roughness = 0.1;
                                                newMat.metalness = 0.25;
                                                newMat.emissive = new THREE.Color("#00f0ff");
                                                newMat.emissiveIntensity = 0.25;
                                            }
                                            return newMat;
                                        };
                                        if (Array.isArray(child.material)) {
                                            child.material = child.material.map(processMaterial);
                                        } else {
                                            child.material = processMaterial(child.material);
                                        }
                                    }
                                }
                            } );
                            object.scale.set(sizeOfObjects[type], sizeOfObjects[type], sizeOfObjects[type]);
                            var buildingHeight = elevation_value;
                            if (typeof getCornerElevation !== "undefined") {
                                var y0 = getCornerElevation(row, column);
                                var y1 = getCornerElevation(row + 1, column);
                                var y2 = getCornerElevation(row, column + 1);
                                var y3 = getCornerElevation(row + 1, column + 1);

                                var u = (ox + 50) / 100;
                                var v = (oz + 50) / 100;
                                u = Math.max(0, Math.min(1, u));
                                v = Math.max(0, Math.min(1, v));

                                buildingHeight = y0 * (1 - u) * (1 - v) + y1 * u * (1 - v) + y2 * (1 - u) * v + y3 * u * v;
                            }
                            object.position.set(x + ox, buildingHeight, z + oz);
                            object.rotation.y = rotY;
                            scene.add( object );
                                                        } );

                } );
    };

    function clearFlood() {


        transform.scale.set(0, 0, 0);

        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {

                obj = floodTiles[row][column];

                if (obj != 0) {

                    transform.position.set(
                        -10,
                        -10,
                        -10);
                    transform.updateMatrix();

                    meshDict[obj.type].setMatrixAt(obj.instanceId, transform.matrix);
                    updateBorderHeight(row, column, groundTiles[row][column].elevation, numberOfRows, numberOfColumns);
                }

            };
        };

        meshDict["flood"].instanceMatrix.needsUpdate = true;
        scene.remove(meshDict["flood"]);
    };


    function animate() {

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        const updated = cameraControls.update(delta);

        requestAnimationFrame(animate);

        if (doFlood) {

            floodAction();
        };
        // if (Math.floor(Math.random() * 100) == 8 && doFlood == false){
        //     waterMovement();

        // }
        render();
        stats.update();

    };


    function render() {

        renderer.render(scene, camera);

    };


    function resolveRowColumn(intersection) {
        if (!intersection || intersection.length === 0) return null;
        
        var obj = intersection[0].object;
        while (obj && obj !== scene) {
            if (obj.externalID) {
                var parts = obj.externalID.split("_");
                return [parseInt(parts[0]), parseInt(parts[1]), 1];
            }
            obj = obj.parent;
        }

        var meshName = intersection[0].object.name;
        var instanceId = intersection[0].instanceId;

        if (meshName === "smoothTerrain") {
            var [r, c] = calculateArrayPosition(intersection[0].point.x, intersection[0].point.z);
            return [r, c, 1];
        }

        if (instanceId !== undefined && instanceId !== -1 && !isWireFrame(meshName)) {
            try {
                return findPosition(instanceId, meshName);
            } catch (e) {
                // silent catch
            }
        }

        return null;
    }

    function onMouseMove(event) {
        event.preventDefault();
        const { top, left, width, height } = renderer.domElement.getBoundingClientRect();

        mouse.x = ((event.clientX - left) / width) * 2 - 1;
        mouse.y = -((event.clientY - top) / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        var intersection = raycaster.intersectObjects(scene.children, true);
        var res = resolveRowColumn(intersection);
        if (res !== null) {
            var [row, column, size] = res;
            if (row >= 0 && row < 50 && column >= 0 && column < 50) {
                var [pos_x, pos_z] = calculatePosition(row, column);
                updateTileInformationPanelOnMouseMove(row, column);
                moveWireFrame_2(1, row, column);
            }
        }
    }

    function isWireFrame(name) {
        if (name == "wireframe_1" || name == "wireframe_2" || name == "borderSegments" || name == "wireframe_3" || name == "wireframe_4") {
            return true;
        }
        return false;
    }

    function onMouseClick(event) {
        event.preventDefault();
        const { top, left, width, height } = renderer.domElement.getBoundingClientRect();

        mouse.x = ((event.clientX - left) / width) * 2 - 1;
        mouse.y = -((event.clientY - top) / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        var intersection = raycaster.intersectObjects(scene.children, true);
        var res = resolveRowColumn(intersection);
        if (res !== null) {
            var [row, column, size] = res;
            if (row >= 0 && row < 50 && column >= 0 && column < 50) {
                switch (event.button) {
                    case 0: //left
                        wireframe_1.visible = false;
                        wireframe_4.visible = false;

                        if (!selectedTile.isSelected) {
                            showEmptyTileGUI(true);
                            showBuildingTileGUI(true);
                            fillSelectedTile(row, column, event);
                        } else {
                            if (selectedTile.row == row && selectedTile.column == column) {
                                showEmptyTileGUI(false);
                                showBuildingTileGUI(false);
                                clearSelectedTile();
                            } else if (selectedBuilding.isMove) {
                                changePositionBuilding(row, column);
                            } else {
                                clearSelectedTile();
                                showEmptyTileGUI(true);
                                showBuildingTileGUI(true);
                                fillSelectedTile(row, column, event);
                            }
                        }
                        break;
                    case 2: // right
                        clearSelectedTile();
                }
            }
        }
    };


    function calculatePosition(row, column, tileSize = 100, offset_x = 3900, offset_z = 5000) {

        var m, n, pos_x, pos_z;
        var roww = numberOfRows - row - 1;
        var columnn = numberOfColumns - column - 1;
        m = row / 2;
        n = Math.floor(row / 2);

        pos_x = roww * tileSize - tileSize * (numberOfRows / 2) + (tileSize / 2);
        pos_z = -columnn * tileSize + tileSize * (numberOfColumns / 2) - (tileSize / 2);
        return [pos_x, pos_z];

    };



    function calculateArrayPosition(pos_x, pos_z, tileSize = 100, offset_x = 3900, offset_z = 5000) {

        var m, n, row, column, pos_xx, pos_zz;
        var roww, columnn;

        roww = ((pos_x - (tileSize / 2)) + tileSize * (numberOfRows / 2)) / tileSize;

        columnn = -((pos_z + (tileSize / 2)) - (tileSize * (numberOfColumns / 2))) / tileSize;

        row = numberOfRows - roww - 1;
        column = numberOfColumns - columnn - 1;
        if (column == 0) {
            column = 0;
        }

        return [row, column];

    };


    function findPosition(instanceId, meshName) {
        var row, column, size;

        if (meshName == "road_v" || meshName == "tree" || meshName == "road_h" || meshName == "tree2") {
            row = dictInstancedIdtoSurfacePosition[meshName][instanceId][0];
            column = dictInstancedIdtoSurfacePosition[meshName][instanceId][1];
            size = 6;
        } else {
            var instanceMatrix_ = new THREE.Matrix4();
            var vector3Scale_ = new THREE.Vector3(1, 1, 1);
            var vector3Position_ = new THREE.Vector3(1, 1, 1);
            meshDict[meshName].getMatrixAt(instanceId, instanceMatrix_);
            vector3Position_.setFromMatrixPosition(instanceMatrix_);
            vector3Scale_.setFromMatrixScale(instanceMatrix_);
            [row, column] = calculateArrayPosition(vector3Position_.x, vector3Position_.z);
            size = findSize(vector3Scale_.x);
        }


        return [row, column, size];

    };


    function findSize(scaleValue = 100) {
        var s;
        s = scaleValue / tileSize;
        return s;
    };


    function findElevation(row, column) {

        if (isFlood) {
            return groundTiles[row][column].elevation + floodTiles[row][column].height;
        };

        return groundTiles[row][column].elevation;

    };


    function fillSelectedTile(row, column, event) {
        //console.log(row, column);
        selectedTile.isSelected = true;
        selectedTile.instanceId = groundTiles[row][column].instanceId;
        selectedTile.meshName = groundTiles[row][column].type;
        selectedTile.row = row;
        selectedTile.column = column;
        [selectedTile.pos_x, selectedTile.pos_z] = calculatePosition(
            row, column);
        selectedTile.elevation = groundTiles[row][column].elevation;
        guiCostUpdateOnTileChanged();
        clearMitigationOptions();
        if (surfaceTiles[row][column] != 0) {
            showEmptyTileGUI(false);
            fillSelectedBuilding(row, column);
        } else {
            showBuildingTileGUI(false);
            showEmptyTileGUI(true);
            if (surfaceTiles_v2[row][column].type != "tree" && surfaceTiles_v2[row][column].type != "tree2"){
                //console.log("Not tree")
                showEmptyTileGUI(false);
                showMitigationOption(mitigationMetaData["flood_wall"]["id"]);
            };
        };


        // if (hasMitigation(row, column)) {
        //     moveWireFrame_3(1, row, column);
        //     wireframe_2.visible = false
        // } else {
        //     wireframe_3.visible = false;
        //     moveWireFrame_2(1, row, column);
        // };
        moveWireFrame_3(1, row, column);
        updateTileOptions(row, column);
        updateTileInformationPanel();
        tileInformationPanelTabButtons[1].click();
    };

    function convertFloodWallHeighttoSelectedIndex(value) {
        /*
            This function takes a Flood Wall height option
            and return index of that value in dropdown menu
            in main game panel.

            Inputs:
                value: Flood Wall Height

            Outputs:
                index: selectedIndex of input on dropdown
        */


        if (value == 1) {
            return 0;
        } else if (value == 2) {
            return 1;
        } else if (value == 3) {
            return 2;
        } else if (value == 4) {
            return 3
        } else {
            return 0;
        };
    };

    function convertSandBagHeighttoSelectedIndex(value) {
        /*
            This function takes a Sand Bag height option
            and return index of that value in dropdown menu
            in main game panel.

            Inputs:
                value: Sand Bag Height

            Outputs:
                index: selectedIndex of input on dropdown
        */


        if (value == 1) {
            return 0;
        } else if (value == 2) {
            return 1;
        } else if (value == 3) {
            return 2;
        } else {
            return 0;
        };
    };

    function updateTileOptions(row, column) {
        /*
            This function defines additional rules
            related to interaction between different
            mitigation options for the tile which positioned
            on (row, column) location.

            Inputs:
                row: row of the selected tile
                column: column of the selected tile
        */


        var tempGroundTiles1 = groundTiles[row][column];

        /* Check selected tile already have a mitigation option */
        if (!hasMitigation(row, column)) {
            clearMitigationOptions();
            if (surfaceTiles[row][column]) {
                showEmptyTileGUI(false);
                showBuildingTileGUI(true);
            } else {
                showBuildingTileGUI(false);
                showEmptyTileGUI(true);
                if (surfaceTiles_v2[row][column].type != "tree" && surfaceTiles_v2[row][column].type != "tree2"){
                    showEmptyTileGUI(false);
                    showMitigationOption(mitigationMetaData["flood_wall"]["id"]);
                }
                else{
                    showEmptyTileGUI(false);
                    showMitigationOption(mitigationMetaData["flood_wall"]["id"]);
                    showMitigationOption(mitigationMetaData["add_structure"]["id"]);

                }
            };
            return;
        };

        /* Find which mitigation option is already applied*/
        var temp_mit_id = whichMitigationType(row, column);

        //console.log(temp_mit_id)
        /* Add Structure */
        if (temp_mit_id == 10) {

        } else {
            uncheckMitigationStatus(mitigation_opts[0]);
            hideMitigationOptionbyDOMParent(mitigation_opts[0]);
        };


        /* Change Tile */
        if (temp_mit_id == 10) {

        } else {
            uncheckMitigationStatus(mitigation_opts[1]);
            hideMitigationOptionbyDOMParent(mitigation_opts[1]);
        };


        /* Flood Wall */
        if (temp_mit_id == 2) {
            checkMitigationStatus(mitigation_opts[2]);
            allMitigationsSelects[2].selectedIndex = convertFloodWallHeighttoSelectedIndex(tempGroundTiles1.floodWall);
            disableMitigationValue(mitigation_opts[2]);
        } else {
            uncheckMitigationStatus(mitigation_opts[2]);
            allMitigationsSelects[2].selectedIndex = convertFloodWallHeighttoSelectedIndex(0);
            hideMitigationOptionbyDOMParent(mitigation_opts[2]);
        };


        /* Sand Bag */
        if (temp_mit_id == 3) {
            checkMitigationStatus(mitigation_opts[3]);
            allMitigationsSelects[3].selectedIndex = convertSandBagHeighttoSelectedIndex(tempGroundTiles1.sandbag);
            disableMitigationValue(mitigation_opts[3]);
        } else {
            uncheckMitigationStatus(mitigation_opts[3]);
            allMitigationsSelects[3].selectedIndex = convertSandBagHeighttoSelectedIndex(0);
            hideMitigationOptionbyDOMParent(mitigation_opts[3]);
        };


        /* Insurance */
        if (temp_mit_id == 4) {
            checkMitigationStatus(mitigation_opts[4]);
        } else {
            uncheckMitigationStatus(mitigation_opts[4]);
            hideMitigationOptionbyDOMParent(mitigation_opts[4]);
        };


        /* Relocate Structure */
        if (temp_mit_id == 10) {

        } else {
            uncheckMitigationStatus(mitigation_opts[5]);
            hideMitigationOptionbyDOMParent(mitigation_opts[5]);
        };


        /* Remove Structure */
        if (temp_mit_id == 10) {

        } else {
            uncheckMitigationStatus(mitigation_opts[6]);
            hideMitigationOptionbyDOMParent(mitigation_opts[6]);
        };


        /* Elevate Structure */
        if (temp_mit_id == 1) {
            checkMitigationStatus(mitigation_opts[7]);
            elevateStructureSlider[0].value = surfaceTiles[selectedTile.row][selectedTile.column].elevateStructure;
            disableMitigationValue(mitigation_opts[7]);
        } else {
            uncheckMitigationStatus(mitigation_opts[7]);
            elevateStructureSlider[0].value = 1;
            hideMitigationOptionbyDOMParent(mitigation_opts[7]);
        };

        // Dry floodproofing
        if (temp_mit_id == 5){
            //console.log("checkk dry")
            checkMitigationStatus(mitigation_opts[9]);
            allMitigationsSelects[5].selectedIndex = convertSandBagHeighttoSelectedIndex(surfaceTiles[row][column].Dryfloodproofing);
            disableMitigationValue(mitigation_opts[9]);
        } else {
            uncheckMitigationStatus(mitigation_opts[9]);
            allMitigationsSelects[5].selectedIndex = convertSandBagHeighttoSelectedIndex(0);
            hideMitigationOptionbyDOMParent(mitigation_opts[9]);
        }

        // Wet floodproofing
        if (temp_mit_id == 6){
            checkMitigationStatus(mitigation_opts[8]);
            allMitigationsSelects[4].selectedIndex = convertSandBagHeighttoSelectedIndex(surfaceTiles[row][column].Wetfloodproofing);
            disableMitigationValue(mitigation_opts[8]);
        } else {
            uncheckMitigationStatus(mitigation_opts[8]);
            allMitigationsSelects[4].selectedIndex = convertSandBagHeighttoSelectedIndex(0);
            hideMitigationOptionbyDOMParent(mitigation_opts[8]);

        }


    };


    function clearSelectedTile() {

        selectedTile.isSelected = false;
        selectedTile.instanceId = -1;
        selectedTile.meshName = "None";
        selectedTile.elevation = 0;
        selectedTile.pos_z = -1;
        selectedTile.pos_x = -1;
        selectedTile.row = -1;
        selectedTile.column = -1;


        clearSelectedBuilding();
        //moveWireFrame_2(2, 0, 0);
        moveWireFrame_3(2, 0, 0);
        tileInformationPanelTabButtons[0].click();

    };


    function fillSelectedBuilding(row, column) {
        selectedBuilding.isSelected = true;
        /*
        if (Array.isArray(surfaceTiles[row][column])) {
            selectedBuilding.meshName = surfaceTiles[row][column][0].type;
            selectedBuilding.instanceId = surfaceTiles[row][column][0].instanceId;
            selectedBuilding.height = surfaceTiles[row][column][0].height;
            selectedBuilding.size = surfaceTiles[row][column][0].size;
            selectedBuilding.peopleOnIt = surfaceTiles[row][column][0].peopleOnIt;
        } else {
            */
            selectedBuilding.meshName = surfaceTiles[row][column].type;
            selectedBuilding.instanceId = surfaceTiles[row][column].instanceId;
            selectedBuilding.height = surfaceTiles[row][column].height;
            selectedBuilding.size = surfaceTiles[row][column].size;
            selectedBuilding.peopleOnIt = surfaceTiles[row][column].peopleOnIt;
        

        selectedBuilding.row = row;
        selectedBuilding.column = column;
        [selectedBuilding.pos_x, selectedBuilding.pos_z] = calculatePosition(
            row, column);

        guiCostUpdateForNonOptionMitigations();
        showEmptyTileGUI(false);
        showBuildingTileGUI(true);
    };


    function clearSelectedBuilding() {

        selectedBuilding.isSelected = false;
        selectedBuilding.instanceId = -1;
        selectedBuilding.meshName = "None";
        selectedBuilding.pos_x = -1;
        selectedBuilding.pos_z = -1;
        selectedBuilding.row = -1;
        selectedBuilding.column = -1;
        selectedBuilding.size = -1;
        selectedBuilding.height = 0;
        selectedBuilding.isMove = false;
        selectedBuilding.peopleOnIt = 0;
    };


    function moveWireFrame_1(type, row, column) {

        var [pos_x, pos_z] = [selectedTile.pos_x, selectedTile.pos_z];
        var floodHeight = 0;

        if (isFlood) {
            floodHeight = floodTiles[row][column].height;
        };
        wireframe_1.geometry.setPositions(borderPosition(row, column, findElevation(row, column) + 2, 50).flat(1));
        if (type == 1) { wireframe_1.visible = true; } else { wireframe_1.visible = false; };

        wireframe_1.updateMatrix();
    };


    function moveWireFrame_2(type, row, column) {

        var [pos_x, pos_z] = [selectedTile.pos_x, selectedTile.pos_z];
        var floodHeight = 0;

        if (isFlood) {
            floodHeight = floodTiles[row][column].height;
        };
        /*
        wireframe_2.position.set(
            selectedTile.pos_x,
            groundTiles[row][column].elevation + floodHeight + 4,
            selectedTile.pos_z);
            */
        wireframe_2.geometry.setPositions(borderPosition(row, column, findElevation(row, column) + 2, 50).flat(1));
        var c = whichColor(row, column);
        wireframe_2.geometry.setColors([c, c, c, c, c, c, c, c].flat(1));

        if (type == 1) { wireframe_2.visible = true; } else { wireframe_2.visible = false; };

        wireframe_2.updateMatrix();

    };

    function moveWireFrame_3(type, row, column) {

        var [pos_x, pos_z] = [selectedTile.pos_x, selectedTile.pos_z];
        var floodHeight = 0;

        if (isFlood) {
            floodHeight = floodTiles[row][column].height;
        };
        wireframe_3.geometry.setPositions(
            borderPosition(row, column, findElevation(row, column) + 2, 50).flat(1));
        var c = whichColor(row, column);
        wireframe_3.geometry.setColors([c, c, c, c, c, c, c, c].flat(1));
        if (type == 1) { wireframe_3.visible = true; } else { wireframe_3.visible = false; };

        wireframe_3.updateMatrix();

    };

    function moveWireFrame_4(type, row, column) {

        var [pos_x, pos_z] = [selectedTile.pos_x, selectedTile.pos_z];
        var floodHeight = 0;

        if (isFlood) {
            floodHeight = floodTiles[row][column].height;
        };
        wireframe_4.geometry.setPositions(
            borderPosition(row, column, findElevation(row, column) + 2, 50).flat(1));
        if (type == 1) { wireframe_4.visible = true; } else { wireframe_4.visible = false; };

        wireframe_4.updateMatrix();

    };




    function changePositionBuilding(row, column) {

        if (["water", "parking_lot", "road", "building"].includes(groundTiles[row][column].type)) {
            alert("Destination should be empty tile!!!");
            clearSelectedTile();
            return
        };

        
        clearTileForBuilding(row, column);

        obj = surfaceTiles[selectedBuilding.row][selectedBuilding.column];
        var [x, z] = calculatePosition(row, column);

        if (isNonInstancing(obj.type)){
            changePositionofObject(`${obj.row}_${obj.column}`, x, groundTiles[row][column].elevation, z);
        }
        else{
            transform.scale.set(
                1,
                1,
                1,
            );

            transform.position.set(
                x,
                groundTiles[row][column].elevation,
                z);
            transform.updateMatrix();

            meshDict[obj.type].setMatrixAt(obj.instanceId, transform.matrix);
            meshDict[obj.type].instanceMatrix.needsUpdate = true;
        }
        surfaceTiles[row][column] = surfaceTiles[obj.row][obj.column];
        surfaceTiles[obj.row][obj.column] = 0;
        surfaceTiles[row][column].row = row;
        surfaceTiles[row][column].column = column;
        surfaceTiles[row][column].elevation = groundTiles[row][column];
        clearTileForBuilding(selectedBuilding.row, selectedBuilding.column);
        createPark(selectedBuilding.row, selectedBuilding.column);

        clearSelectedTile();
        fillSelectedTile(row, column);

        expenses += mitigationMetaData["relocate_structure"]["cost"];
        totalAvailableMoney -= mitigationMetaData["relocate_structure"]["cost"];
        updateGameProgressPanel();
    };


    function createBuilding(type, row, column, height = 100, size = 6) {

        var [x, z] = calculatePosition(row, column);

        clearTileForBuilding(row, column);


        if (type == "tree") {
            surfaceTiles[row][column] = []
            dictSurfacePositiontoInstancedId["tree"][
                [row, column]
                    ] = [];
            for (var i = 0; i < Math.max(Math.ceil(Math.random() * 40), 10); i++) {
                if (Math.random() > 0.5) {
                    var x1 = x + Math.random() * 40;
                    var z1 = z + Math.random() * 40;
                } else {
                    var x1 = x - Math.random() * 40;
                    var z1 = z - Math.random() * 40;
                }

                transform.scale.set(
                    1,
                    1,
                    1);
                transform.position.set(
                    x1,
                    groundTiles[row][column].elevation,
                    z1);
                transform.updateMatrix();
                meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
                meshDict[type].instanceMatrix.needsUpdate = true;
                surfaceTiles[row][column].push(createSurfaceObject(
                    type, row, column, height, groundTiles[row][column].elevation, meshDictIndex[type][0] - 1));
                                        dictSurfacePositiontoInstancedId["tree"][
                            [row, column]
                        ].push(meshDictIndex["t1"][0] - 1);
                        dictInstancedIdtoSurfacePosition["t1"][meshDictIndex["t1"][0] - 1] = [row, column];

            };
            


        }
        else if (type == "tree2") {
            surfaceTiles[row][column] = []
            dictSurfacePositiontoInstancedId["tree2"][
                [row, column]
                    ] = [];
            for (var i = 0; i < Math.max(Math.ceil(Math.random() * 40), 10); i++) {
                if (Math.random() > 0.5) {
                    var x1 = x + Math.random() * 40;
                    var z1 = z + Math.random() * 40;
                } else {
                    var x1 = x - Math.random() * 40;
                    var z1 = z - Math.random() * 40;
                }

                transform.scale.set(
                    1,
                    1,
                    1);
                transform.position.set(
                    x1,
                    groundTiles[row][column].elevation,
                    z1);
                transform.updateMatrix();
                meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
                meshDict[type].instanceMatrix.needsUpdate = true;
                surfaceTiles[row][column].push(createSurfaceObject(
                    type, row, column, height, groundTiles[row][column].elevation, meshDictIndex[type][0] - 1));
                                        dictSurfacePositiontoInstancedId["tree2"][
                            [row, column]
                        ].push(meshDictIndex["t1"][0] - 1);
                        dictInstancedIdtoSurfacePosition["t1"][meshDictIndex["t1"][0] - 1] = [row, column];

            };
            


        }
        else if (type == "road") {
            surfaceTiles[row][column] = []
                    dictSurfacePositiontoInstancedId["road"][
                        [row, column]
                    ] = [];
            transform.scale.set(
                1,
                1,
                1);

            transform.position.set(
                x - 25,
                groundTiles[row][column].elevation + 2,
                z);
            transform.updateMatrix();

            meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
            meshDict[type].instanceMatrix.needsUpdate = true;

            surfaceTiles[row][column].push(createSurfaceObject(
                type, row, column, height, groundTiles[row][column].elevation, meshDictIndex[type][0] - 1));
            dictInstancedIdtoSurfacePosition["road"][meshDictIndex["road"][0] - 1] = [row, column];
                    dictSurfacePositiontoInstancedId["road"][
                        [row, column]
                    ].push(meshDictIndex["road"][0] - 1);
            transform.position.set(
                x + 25,
                groundTiles[row][column].elevation + 2,
                z);
            transform.updateMatrix();
            meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
            meshDict[type].instanceMatrix.needsUpdate = true;
            surfaceTiles[row][column].push(createSurfaceObject(
                type, row, column, height, groundTiles[row][column].elevation, meshDictIndex[type][0] - 1));
            dictInstancedIdtoSurfacePosition["road"][meshDictIndex["road"][0] - 1] = [row, column];
                    dictSurfacePositiontoInstancedId["road"][
                        [row, column]
                    ].push(meshDictIndex["road"][0] - 1);


        } else if (type == "road_h") {
            surfaceTiles[row][column] = []
                    dictSurfacePositiontoInstancedId["road_h"][
                        [row, column]
                    ] = [];

            transform.scale.set(
                1,
                1,
                1);

            transform.position.set(
                x,
                groundTiles[row][column].elevation + 2,
                z - 25);
            transform.updateMatrix();

            meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
            meshDict[type].instanceMatrix.needsUpdate = true;

            surfaceTiles[row][column].push(createSurfaceObject(
                type, row, column, height, groundTiles[row][column].elevation, meshDictIndex[type][0] - 1));
            dictInstancedIdtoSurfacePosition["road_h"][meshDictIndex["road_h"][0] - 1] = [row, column];
                    dictSurfacePositiontoInstancedId["road_h"][
                        [row, column]
                    ].push(meshDictIndex["road_h"][0] - 1);

            transform.position.set(
                x,
                groundTiles[row][column].elevation + 2,
                z + 25);
            transform.updateMatrix();
            meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
            meshDict[type].instanceMatrix.needsUpdate = true;
            surfaceTiles[row][column].push(createSurfaceObject(
                type, row, column, height, groundTiles[row][column].elevation, meshDictIndex[type][0] - 1));
            dictInstancedIdtoSurfacePosition["road_h"][meshDictIndex["road_h"][0] - 1] = [row, column];
                    dictSurfacePositiontoInstancedId["road_h"][
                        [row, column]
                    ].push(meshDictIndex["road_h"][0] - 1);



        } 
        else if (isNonInstancing(type)){
            addObjects(x, z, groundTiles[row][column].elevation, type, row, column);
            surfaceTiles[row][column] = surfaceTile(
                row, column, groundTiles[row][column].elevation, type, 0
                );
        }
        else {
            transform.scale.set(
                1,
                1,
                1);

            transform.position.set(
                x,
                groundTiles[row][column].elevation,
                z);
            transform.updateMatrix();

            meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
            meshDict[type].instanceMatrix.needsUpdate = true;

            surfaceTiles[row][column] = createSurfaceObject(
                type, row, column, height, groundTiles[row][column].elevation, meshDictIndex[type][0] - 1);
        }

    };

    function setBubble(range, bubble) {
        const val = range.value;
        const min = range.min ? range.min : 0;
        const max = range.max ? range.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        bubble.innerHTML = val;

        // Sorta magic numbers based on size of the native UI thumb
        bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
    };

    function createSurfaceObject(
        type, row, column, height=100, elevation, instanceId, size = 6, peopleOnIt = 50, floodInsurance = 0) {

        var tempTile = {};
        tempTile.row = row;
        tempTile.column = column;
        tempTile.elevation = elevation;
        tempTile.height = height;
        tempTile.size = size;
        tempTile.type = type;
        tempTile.instanceId = instanceId;
        tempTile.peopleOnIt = peopleOnIt;
        tempTile.floodInsurance = floodInsurance;
        tempTile.elevateStructure = 0;
        tempTile.Dryfloodproofing = 0;
        tempTile.Wetfloodproofing = 0;
        tempTile.sandBag = 0;
        return tempTile;

    };


    function changeElevation(row, column, elevation) {

        groundTiles[row][column].elevation = elevation;


        var [x, z] = calculatePosition(row, column);



        transform.scale.set(
            tileSize,
            elevation,
            tileSize);

        transform.position.set(
            x,
            elevation / 2,
            z);
        transform.updateMatrix();

        meshDict[groundTiles[row][column].type].setMatrixAt(groundTiles[row][column].instanceId, transform.matrix);
        meshDict[groundTiles[row][column].type].instanceMatrix.needsUpdate = true;

        if (hasMitigation(row, column)) {
            moveWireFrame_3(1, row, column);
        } else {
            moveWireFrame_2(1, row, column);
        };


        updateBorderHeight(row, column, elevation, numberOfRows, numberOfColumns);

        if (surfaceTiles[row][column]) {

            surfaceTiles[row][column].elevation = elevation;



            transform.scale.set(
                1,
                1,
                1);

            transform.position.set(
                x,
                elevation,
                z);
            transform.updateMatrix();

            meshDict[surfaceTiles[row][column].type].setMatrixAt(surfaceTiles[row][column].instanceId, transform.matrix);
            meshDict[surfaceTiles[row][column].type].instanceMatrix.needsUpdate = true
        };


    };


    function changeTileType(type, row, column) {

        // Delete tile from meshdict -- function is needed
        transform.scale.set(0, 0, 0);
        transform.position.set(-10, -10, -10);
        transform.updateMatrix();
        meshDict[groundTiles[row][column]["type"]].setMatrixAt(groundTiles[row][column].instanceId, transform.matrix);
        meshDictIndex[groundTiles[row][column]["type"]][1].push(groundTiles[row][column].instanceId);
        meshDict[groundTiles[row][column]["type"]].instanceMatrix.needsUpdate = true;

        // new tile is created
        groundTiles[row][column].type = type;
        obj = groundTiles[row][column];

        var [x, z] = calculatePosition(row, column);



        transform.scale.set(
            tileSize,
            obj.elevation,
            tileSize);

        transform.position.set(
            x,
            obj.elevation / 2,
            z);
        transform.updateMatrix();

        meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
        meshDict[type].instanceMatrix.needsUpdate = true;

        groundTiles[row][column].instanceId = meshDictIndex[type][0] - 1;



    };



    


    function clearTileForBuilding(row, column){
        /*
            This function clears the tile on map to
            add structure. It deletes trees and change the ground tile
            type to building.
            Input: row, column of cleared tile

        */

        if (surfaceTiles_v2[row][column] != 0){
            if (surfaceTiles_v2[row][column].type == "tree"){
                transform.scale.set(0, 0, 0);
                transform.position.set(-10, -10, -10);
                transform.updateMatrix();

                for (let id of dictSurfacePositiontoInstancedId["tree"][[row, column]]){
                    meshDict["tree"].setMatrixAt(id, transform.matrix);
                    meshDictIndex["tree"][1].push(id);
                    delete dictInstancedIdtoSurfacePosition["tree"][id];
                };
                delete dictSurfacePositiontoInstancedId["tree"][[row, column]];
                meshDict["tree"].instanceMatrix.needsUpdate = true;
                surfaceTiles_v2[row][column] = 0;

            }
            else if (surfaceTiles_v2[row][column].type == "tree2"){
                transform.scale.set(0, 0, 0);
                transform.position.set(-10, -10, -10);
                transform.updateMatrix();

                for (let id of dictSurfacePositiontoInstancedId["tree2"][[row, column]]){
                    meshDict["tree2"].setMatrixAt(id, transform.matrix);
                    meshDictIndex["tree2"][1].push(id);
                    delete dictInstancedIdtoSurfacePosition["tree2"][id];
                };
                delete dictSurfacePositiontoInstancedId["tree2"][[row, column]];
                meshDict["tree2"].instanceMatrix.needsUpdate = true;
                surfaceTiles_v2[row][column] = 0;

            }
            else if (surfaceTiles_v2[row][column].type == "parking"){
                transform.scale.set(0, 0, 0);
                transform.position.set(-10, -10, -10);
                transform.updateMatrix();
                meshDict["parking"].setMatrixAt(surfaceTiles_v2[row][column].instanceId, transform.matrix);
                meshDictIndex["parking"][1].push(surfaceTiles_v2[row][column].instanceId);
                meshDict["parking"].instanceMatrix.needsUpdate = true;
                surfaceTiles_v2[row][column] = 0;

            }
            else{
                //console.log("Tile is not parking lot or park")
            };

        };

        if (groundTiles[row][column].type != "building"){
            changeTileType(
                "building",
                row,
                column
            );
        };

    };


    function createPark(row, column){
        /*
            It converts to groundTile to parks and add
            trees to map.
            
            Input: row, column
        */

        if (groundTiles[row][column].type != "parks"){
            changeTileType(
                "parks",
                row,
                column
            );
        };
        surfaceTiles_v2[row][column] = createSurfaceObject(
            "tree",
            row,
            column,
            100,
            groundTiles[row][column].elevation,
            [])
        var [x, z] = calculatePosition(row, column)
        dictSurfacePositiontoInstancedId["tree"][
            [row, column]] = [];
        transform.scale.set(1, 1, 1);
        for (var i = 0; i < 4; i++){
            if (i == 0){
                var x1 = x + getRandomArbitrary(10, 45);
                var z1 = z + getRandomArbitrary(10, 45);
            }
            else if (i == 1){
                var x1 = x + getRandomArbitrary(10, 45); 
                var z1 = z - getRandomArbitrary(10, 45);
            }
            else if (i == 2){
                var x1 = x - getRandomArbitrary(10, 45);
                var z1 = z + getRandomArbitrary(10, 45);

            }
            else{
                var x1 = x - getRandomArbitrary(10, 45);
                var z1 = z - getRandomArbitrary(10, 45);
            }
            transform.position.set(
                x1,
                groundTiles[row][column].elevation,
                z1);
            transform.updateMatrix();
            meshDict["tree"].setMatrixAt(meshDictIndex["tree"][0]++, transform.matrix);
            surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["tree"][0] - 1);
            dictInstancedIdtoSurfacePosition["tree"][meshDictIndex["tree"][0] - 1] = [row, column];
            dictSurfacePositiontoInstancedId["tree"][
                [row, column]].push(meshDictIndex["tree"][0] - 1);
        };
        meshDict["tree"].instanceMatrix.needsUpdate = true;
    };




    // it can be generalize to remove any instance
    function deleteBuilding() {

        transform.scale.set(0, 0, 0);
        transform.position.set(-10, -10, -10);
        transform.updateMatrix();

        
        if (["t1", "road", "road_h"].includes(selectedBuilding.meshName)) {

            for (let id of dictSurfacePositiontoInstancedId[selectedBuilding.meshName][
                    [selectedBuilding.row, selectedBuilding.column]
                ]) {
                
                meshDict[selectedBuilding.meshName].setMatrixAt(id, transform.matrix);
                meshDictIndex[selectedBuilding.meshName][1].push(id);
                delete dictInstancedIdtoSurfacePosition[selectedBuilding.meshName][id];
            };
            delete dictSurfacePositiontoInstancedId[selectedBuilding.meshName][selectedBuilding.row, selectedBuilding.column];

        }
        else if (isNonInstancing(selectedBuilding.meshName)){
            deleteObjectFromScene(`${selectedBuilding.row}_${selectedBuilding.column}`);
            createPark(selectedBuilding.row, selectedBuilding.column);
        }
        else {

            meshDict[selectedBuilding.meshName].setMatrixAt(selectedBuilding.instanceId, transform.matrix);
            meshDictIndex[selectedBuilding.meshName][1].push(selectedBuilding.instanceId);
            createPark(selectedBuilding.row, selectedBuilding.column);
            meshDict[selectedBuilding.meshName].instanceMatrix.needsUpdate = true;

        };
        surfaceTiles[selectedBuilding.row][selectedBuilding.column] = 0;
    };



    function changeColorOfMitigatedRegions(type = 0) {

        var regions = findMitigatedRegions(type);

        var newColor2 = [1, 0, 1];

        for (var i = 0; i < regions.length; i++) {

            var [row1, column1] = regions[i];
            updateBorderColor(row1, column1, newColor2);
        };

    };

    function findMitigatedRegions(type = 0) {

        var regions = [];

        for (var i = 0; i < numberOfRows; i++) {
            for (var j = 0; j < numberOfColumns; j++) {
                if (hasMitigationType(i, j, type)) {
                    regions.push([i, j])
                };
            };
        };

        return regions;

    };

    function findNumberOfMitigatedRegions() {
        var mitigatedAreaNumber = 0
        for (var i = 0; i < numberOfRows; i++) {
            for (var j = 0; j < numberOfColumns; j++) {
                if (hasMitigation(i, j)) {
                    mitigatedAreaNumber += 1
                };
            };
        };
        return mitigatedAreaNumber;
    };

    function clearColorOfMitigatedRegions(type = 0) {

        var regions = findMitigatedRegions(type);

        var newColor2 = [0, 0, 0];

        for (var i = 0; i < regions.length; i++) {

            var [row1, column1] = regions[i];
            updateBorderColor(row1, column1, newColor2);
        };
    };

    function clearColorOfRiskyRegions() {

        var newColor1 = [0, 0, 0];
        for (var i = 0; i < numberOfRows; i++){
            for (var j = 0; j < numberOfColumns; j++){
                updateBorderColor(i, j, newColor1);
            }
        }
        borderSegments.visible = false;
    };


    function changeColorofRiskyAreas() {
        /*
            This functions change border colors based on
            risk values.
        
        */
        var obj, list_of_positions, list_of_colors;
        updateFloodInformation();

        // 0=> No flood 1=> Secured with mitigation 2=> flood with mitigation 3=> Flood 
        list_of_positions = [
            [],
            [],
            [],
            []
        ]
        list_of_colors = [
            [1, 1, 1],
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0],
        ];

        for (var i = 0; i < numberOfRows; i++) {
            for (var j = 0; j < numberOfColumns; j++) {
                obj = floodTiles[i][j];
                // if there was a flood
                if (obj != 0) {
                    // Not Secured with mitigation
                    if (hasMitigation(i, j)) {
                        list_of_positions[2].push([i, j]);
                    } else {
                        list_of_positions[3].push([i, j]);
                    };
                }
                // if there was no flood at all
                else {
                    if (hasMitigation(i, j)){
                        list_of_positions[1].push([i, j]);
                    } else {
                        list_of_positions[0].push([i, j]);
                    }
                };
            };
        };

        for (var i = 0; i < list_of_positions.length; i++) {
            for (var pos of list_of_positions[i]) {
                updateBorderColor(pos[0], pos[1], list_of_colors[i])
            };
        };
        borderSegments.visible = true;
    };

    function whichColor(row, column){
        /*
            It gives expected border color while
            moving on map.
        */
        var list_of_colors = [
            [1, 1, 1],
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0],
        ];


        if (floodTiles[row][column] != 0){
            if (hasMitigation(row, column)){
                return list_of_colors[2]
            } else{
                return list_of_colors[3]
            };

        }
        else {
            if (hasMitigation(row, column)){
                return list_of_colors[1];
            }
            else{
                return list_of_colors[0];
            }

        }


    };



    function findNumberOfShelteredPeople() {
        /*
            This function finds number of sheltered people
            on the system.
        */
        return 0;
    };


    async function readExternalJSON(filepath){
        /*
            This function reads and return the json
            file at given path.
        */

        var data;

        await fetch(filepath)
            .then(response => data = response.json());
        return data;

    };


    function createBorderWireframe(size) {

        var positions = [];
        var colors = [];

        positions = borderPosition(0, 0, groundTiles[0][0].elevation, size * 0.98);
        colors.push([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]);

        var indicies = [];
        indicies.push(0, 1);
        indicies.push(1, 2);
        indicies.push(2, 3);
        indicies.push(3, 0);

        var bufferGeom = new THREE.BufferGeometry();
        var positionss = new THREE.Float32BufferAttribute(positions.flat(1), 3);
        bufferGeom.setAttribute("position", positionss);
        bufferGeom.setAttribute("color", new THREE.Float32BufferAttribute(colors.flat(1), 3));
        bufferGeom.setIndex(indicies);

        var lsMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
        lsMaterial.linewidth = 4;
        frame1 = new THREE.LineSegments(bufferGeom, lsMaterial);
        frame1.name = "frame1";

        scene.add(frame1);
    };


    function updateFrame(row, column, elevation, size) {


        var positions = borderPosition(row, column, elevation, size * 0.98);

        for (var i = 0; i < 4; i++) {
            frame1.geometry.attributes.position.array[i * 3] = positions[i * 3];
            frame1.geometry.attributes.position.array[1 + i * 3] = elevation;
            frame1.geometry.attributes.position.array[2 + i * 3] = positions[2 + i * 3];
        };

        frame1.geometry.attributes.position.needsUpdate = true;

    };
   function borderPosition(row, column, elevation, size = 50) {

        var [x, z] = calculatePosition(row, column);
        size = size - 1;
        var leftTop, rightBottom, rightTop, leftBottom;

        leftTop = [x - size, elevation + 1, z + size];
        rightBottom = [x + size, elevation + 1, z - size];
        rightTop = [x - size, elevation + 1, z - size];
        leftBottom = [x + size, elevation + 1, z + size];

        return [].concat(leftTop, leftBottom, leftBottom, rightBottom, rightBottom, rightTop, rightTop, leftTop);
    };


    function createBorders(totalRow, totalColumn, size) {

        var positions = [];
        var colors = [];

        for (var row = 0; row < totalRow; row++) {
            for (var column = 0; column < totalColumn; column++) {
                positions.push(borderPosition(row, column, groundTiles[row][column].elevation, size));
                colors.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            };
        };

        var bufferGeom = new LineSegmentsGeometry();
        bufferGeom.setPositions(positions.flat(1));
        bufferGeom.setColors(colors.flat(1));

        var lsMaterial = new LineMaterial( { vertexColors: true, linewidth: 2 } );
        lsMaterial.resolution.set( window.innerWidth, window.innerHeight );

        borderSegments = new LineSegments2( bufferGeom,  lsMaterial );
        // borderSegments.renderOrder = 100;
        borderSegments.name = "borderSegments";
        scene.add(borderSegments);
        borderSegments.visible = false;

    };

    function updateBorderHeight(row, column, elevation, totalRow = 100, totalColumn = 100) {

        var index;

        var [x, z] = calculatePosition(row, column);
        var size = 49;
        var leftTop, rightBottom, rightTop, leftBottom;

        leftTop = [x - size, elevation, z + size];
        rightBottom = [x + size, elevation, z - size];
        rightTop = [x - size, elevation, z - size];
        leftBottom = [x + size, elevation, z + size];

        index = (row * totalColumn + column) * 4;
        borderSegments.geometry.attributes.instanceStart.setXYZ(index, leftTop[0], elevation, leftTop[2]);
        borderSegments.geometry.attributes.instanceEnd.setXYZ(index, leftBottom[0], elevation, leftBottom[2]);

        borderSegments.geometry.attributes.instanceStart.setXYZ(index + 1, leftBottom[0], elevation, leftBottom[2]);
        borderSegments.geometry.attributes.instanceEnd.setXYZ(index + 1, rightBottom[0], elevation, rightBottom[2]);

        borderSegments.geometry.attributes.instanceStart.setXYZ(index + 2, rightBottom[0], elevation, rightBottom[2]);
        borderSegments.geometry.attributes.instanceEnd.setXYZ(index + 2, rightTop[0], elevation, rightTop[2]);

        borderSegments.geometry.attributes.instanceStart.setXYZ(index + 3, rightTop[0], elevation, rightTop[2]);
        borderSegments.geometry.attributes.instanceEnd.setXYZ(index + 3, leftTop[0], elevation, leftTop[2]);

        borderSegments.geometry.attributes.instanceStart.data.needsUpdate = true;
        borderSegments.geometry.attributes.instanceEnd.data.needsUpdate = true;
    };

    function updateBorderColor(row, column, newColor, totalRow = numberOfRows, totalColumn = numberOfColumns) {

        var index;

        index = (row * totalColumn + column) * 4;

        for (var i = 0; i < 4; i++) {
            borderSegments.geometry.attributes.instanceColorStart.setXYZ(index + i, newColor[0], newColor[1], newColor[2]);
            borderSegments.geometry.attributes.instanceColorEnd.setXYZ(index + i, newColor[0], newColor[1], newColor[2]);
        };

        borderSegments.geometry.attributes.instanceColorStart.data.needsUpdate = true;  
        borderSegments.geometry.attributes.instanceColorEnd.data.needsUpdate = true;    

    };




    function findShelterCapacity(){
        var t = 0;

    }

    function countdown(elementName, minutes, seconds) {

        var element, endTime, hours, mins, msLeft, time;

        function twoDigits(n) {
            return (n <= 9 ? "0" + n : n);
        }

        function updateTimer() {
            msLeft = endTime - finishGame - (+new Date);
            if (msLeft < 1000) {
                doFlood = !doFlood;
                updateFloodInformation();
                isFlood = true;
                addFloodScene();
                clearColorOfRiskyRegions();
                //element.innerHTML = "Time is up!";
                element.innerHTML = "Done!";
            } else {
                time = new Date(msLeft);
                hours = time.getUTCHours();
                mins = time.getUTCMinutes();
                element.innerHTML = (hours ? hours + ':' + twoDigits(mins) : mins) + ':' + twoDigits(time.getUTCSeconds());
                setTimeout(updateTimer, time.getUTCMilliseconds() + 500);
            }
        }

        element = document.getElementById(elementName);
        endTime = (+new Date) + 1000 * (60 * minutes + seconds) + 500;
        updateTimer();
    };


    function showEmptyTileGUI(value = true) {
        /*
            This function disables/enables all
            mitigation options which can be applied
            to an empty tile.
        */

        if (value == true) {
            for (var key in mitigationMetaData) {
                var mit_data = mitigationMetaData[key];
                if (mit_data["ground_tile"] == true) {
                    showMitigationOption(mit_data["id"]);
                }
            }
        } else {
            for (var key in mitigationMetaData) {
                var mit_data = mitigationMetaData[key];
                if (mit_data["ground_tile"] == true) {
                    hideMitigationOption(mit_data["id"]);
                }
            }
        }

    };

    function showBuildingTileGUI(value = true) {
        /*
            This function disables/enables all
            mitigation options which can be applied
            to a building tile.
        */

        if (value == true) {
            for (var key in mitigationMetaData) {
                var mit_data = mitigationMetaData[key];
                if (mit_data["structure_tile"] == true) {
                    showMitigationOption(mit_data["id"]);
                }
            }
        } else {
            for (var key in mitigationMetaData) {
                var mit_data = mitigationMetaData[key];
                if (mit_data["structure_tile"] == true) {
                    hideMitigationOption(mit_data["id"]);
                }
            }
        }

    };

    function showMitigationOption(id) {
        /*
            This functions show the mitigation option 
            of given id DOM element.

        */

        if (document.getElementById(id).classList.value.includes("disabled") == true) {
            document.getElementById(id).classList.remove("disabled");
        };
    };

    function hideMitigationOption(id) {
        /*
            This functions hide the mitigation option 
            of given id DOM element.

        */
        if (document.getElementById(id).classList.value.includes("disabled") == false) {
            document.getElementById(id).classList.add("disabled");
        };

    };

    function hideMitigationOptionbyDOMParent(parent) {
        /*
            This functions hide the mitigation option 
            of given parent DOM element.

        */
        if (parent.classList.value.includes("disabled") == false) {
            parent.classList.add("disabled");
        };
    };


    function clearMitigationOptions() {
        /*
            It clears all mitigation menu by eliminating class name 'disabled'
            from mitigation-option classes, checkboxes and dropdown menus.
            In additon that, it unchecks all checkboxes for all mitigation types.
        */
        showEmptyTileGUI(true);
        showBuildingTileGUI(true);
        enablesAllMitigationValue();
        enablesAllMitigationStatus();
        uncheckAllMitigationStatus();
    };


    function enableMitigationValue(parent) {
        /*
            It enables dropdown menu or slider for options of a mitigation type.
            Parent DOM element which has mitigation-option class is given
            as input. 

        */

        if (parent.querySelector(".mitigation-value").classList.value.includes("disabled") == true) {
            parent.querySelector(".mitigation-value").classList.remove("disabled");
        };
    };


    function disableMitigationValue(parent) {
        /*
            It disables dropdown menu or slider for options of a mitigation type.
            Parent DOM element which has mitigation-option class is given
            as input. 
        */

        if (parent.querySelector(".mitigation-value").classList.value.includes("disabled") == false) {
            parent.querySelector(".mitigation-value").classList.add("disabled");
        };
    };


    function enablesAllMitigationValue() {
        /*
            It enables the all dropdown menus and sliders for options of mitigation types.
            It uses enableMitigationValue function.
        */

        for (var i = 0; i < mitigation_opts.length; i++) {
            enableMitigationValue(mitigation_opts[i]);
        };
    };


    function enableMitigationStatus(parent) {
        /*
            It enables checkbox for a mitigation type.
            Parent DOM element which has mitigation-option class is given
            as input. 

        */

        if (parent.querySelector(".mitigation-status").classList.value.includes("disabled") == true) {
            parent.querySelector(".mitigation-status").classList.remove("disabled");
        };
    };


    function disableMitigationStatus(parent) {
        /*
            It disables checkbox for a mitigation type.
            Parent DOM element which has mitigation-option class is given
            as input. 
        */

        if (parent.querySelector(".mitigation-status").classList.value.includes("disabled") == false) {
            parent.querySelector(".mitigation-status").classList.add("disabled");
        };
    };


    function enablesAllMitigationStatus() {
        /*
            It enables the all checkboxes for mitigation types.
            It uses enableMitigationStatus function.
        */

        for (var i = 0; i < mitigation_opts.length; i++) {
            enableMitigationStatus(mitigation_opts[i]);
        };
    };


    function checkMitigationStatus(parent) {
        /*
            It checks checkbox for a mitigation type.
            Parent DOM element which has mitigation-option class is given
            as input. 
        */
        if (parent.querySelector(".mitigation-status input").checked == false) {
            parent.querySelector(".mitigation-status input").checked = true;
        };
    };


    function uncheckMitigationStatus(parent) {
        /*
            It unchecks checkbox for a mitigation type.
            Parent DOM element which has mitigation-option class is given
            as input. 
        */
        if (parent.querySelector(".mitigation-status input").checked == true) {
            parent.querySelector(".mitigation-status input").checked = false;
        };
    };


    function checkAllMitigationStatus() {
        /*
            It checks checkboxes for all mitigation types.
            It uses checkMitigationStatus function.
        */

        for (var i = 0; i < mitigation_opts.length; i++) {
            checkMitigationStatus(mitigation_opts[i]);
        };
    };


    function uncheckAllMitigationStatus() {
        /*
            It unchecks checkboxes for all mitigation types.
            It uses uncheckMitigationStatus function.
        */

        for (var i = 0; i < mitigation_opts.length; i++) {
            uncheckMitigationStatus(mitigation_opts[i]);
        };
    };


    function findRiskValue(row, column) {
        /*
            It calculates the risk level of a tile.
        */
        var obj;
        obj = floodTiles[row][column];
        var risk_level = 0;
        if (obj != 0) {
            risk_level = 5;
        };
        return risk_level;
    };


    function calculateWaterLevel(row, column) {

        /*
            It calculates the risk level of a tile.
        */

        var obj;
        obj = floodTiles[row][column];
        var water_level = 0;
        if (obj != 0) {
            water_level = obj.water_level;
        };
        return Math.round(water_level);
    };



    function hasMitigation(row, column) {
        /*
            It checks whether the tile has mitigation or not.
            Inputs: position of tile as row and column 
        */

        var result = false;

        if (groundTiles[row][column].floodWall != 0) {
            result = true;
        };

        if (surfaceTiles[row][column] != 0) {
            if (surfaceTiles[row][column].floodInsurance != 0 ||
                surfaceTiles[row][column].elevateStructure != 0 || 
                surfaceTiles[row][column].Dryfloodproofing != 0 ||
                surfaceTiles[row][column].Wetfloodproofing != 0 ||
                surfaceTiles[row][column].sandBag != 0) {
                result = true;
            }
            
        };
        return result;
    }

    function hasMitigationType(row, column, type) {
        /*
            It checks whether the tile has specific type of mitigation.
            Inputs: position of tile as row and column, mitigation type
            Types: 
                1 = Elevate Structure
                2 = Flood Wall
                3 = Sandbag
                4 = Insurance
                5 = Dryfloodproofing
                6 = Wetfloodproofing

        */

        var result = false;
        if (type == 0) {
            if (groundTiles[row][column].floodWall != 0) {
                result = true;
            };

            if (surfaceTiles[row][column] != 0) {
                if (surfaceTiles[row][column].floodInsurance != 0 ||
                    surfaceTiles[row][column].elevateStructure != 0 || 
                    surfaceTiles[row][column].Dryfloodproofing != 0 ||
                    surfaceTiles[row][column].Wetfloodproofing != 0 ||
                    surfaceTiles[row][column].sandBag != 0) {
                    result = true;
                };
                
            };
        } else if (type == 1) {
            // Check Elevate Structure
            if (surfaceTiles[row][column] != 0){
                if (surfaceTiles[row][column].elevateStructure != 0) {
                    result = true;
                };
            }
        } else if (type == 2) {
            // Check Flood Wall
            if (groundTiles[row][column].floodWall != 0) {
                result = true;
            };

        } else if (type == 3) {
            // Check sandbag
            if (surfaceTiles[row][column] != 0){
                if (surfaceTiles[row][column].sandBag != 0) {
                    result = true;
                };
            }
        } else if (type == 4) {
            if (surfaceTiles[row][column] != 0){
                if (surfaceTiles[row][column].floodInsurance != 0) {
                    result = true;
                };
            }
        } else if (type == 5){
            if (surfaceTiles[row][column] != 0){
                if (surfaceTiles[row][column].Dryfloodproofing != 0) {
                    result = true;
                };
            }

        } else if (type == 6){
            if (surfaceTiles[row][column] != 0){
                if (surfaceTiles[row][column].Wetfloodproofing != 0) {
                    result = true;
                };
            }

        } else {
            result = false
        };

        return result;
    };


    function whichMitigationType(row, column) {
        /*
            It returns applied mitigation type on given position.
            Mitigation type numbers are same with hasMitigationType 
            function.
            Inputs: position of tile as row and column
        */

        for (var i = 1; i < 7; i++) {
            if (hasMitigationType(row, column, i)) {
                return i
            };
        };
    };


    function updateTileInformationPanelOnMouseMove(row, column) {
        /*
            This function updates tile information panel 
            on the game menu. Panel contains information
            about selected tile's type, water level, number of people
            on the tile and risk level. 

        */

        if (!selectedTile.isSelected){
            var values = document.querySelectorAll("#tile-information .has-text-right")
            var type;

            if (surfaceTiles[row][column] == 0) {
                /* Update #ofPeople */
                values[1].textContent = 0;

                if (groundTiles[row][column].type == "parking_lot"){
                    type = "Parking Lot";
                }
                else if (groundTiles[row][column].type == "water"){
                    type = "Water";
                }
                else if (groundTiles[row][column].type == "parks"){
                    type = "Park";
                }
                else{
                    type = "Road";
                }
            }
            else {
                type = buildingMetaDict[surfaceTiles[row][column].type]["name"];
                /* Update #ofPeople */
                values[1].textContent = surfaceTiles[row][column].peopleOnIt;
            };
            
            values[0].textContent = type;
            /* Update Water Level */
            values[2].textContent = calculateWaterLevel(row, column) + " FT"; //groundTiles[selectedTile.row][selectedTile.column].type;
            

            
            /* Update Risk Level */
            values[3].textContent = findRiskValue(row, column); //groundTiles[selectedTile.row][selectedTile.column].type;
        }

    };


    function updateTileInformationPanel() {
        /*
            This function updates tile information panel 
            on the game menu. Panel contains information
            about selected tile's type, water level, number of people
            on the tile and risk level. 

        */

        // /* tile_info_right = Tile's type + water level */
        // var tile_info_left = tile_info.querySelectorAll(
        //     ".card-content-left .card-content-item");
        // /* tile_info_right = Tile's people + risk level */
        // var tile_info_right = tile_info.querySelectorAll(
        //     ".card-content-right .card-content-item");

        var values = document.querySelectorAll("#tile-information .has-text-right")
        var type;

        /* Update Tile Type */
        // tile_info_left[0].querySelector(
            // ".card-content-item-val").innerHTML = groundTiles[selectedTile.row][selectedTile.column].type;
        if (selectedBuilding.meshName == "None") {
            if (groundTiles[selectedTile.row][selectedTile.column].type == "parking_lot"){
                type = "Parking Lot";
            }
            else if (groundTiles[selectedTile.row][selectedTile.column].type == "water"){
                type = "Water";
            }
            else if (groundTiles[selectedTile.row][selectedTile.column].type == "parks"){
                type = "Park";
            }
            else{
                type = "Road";
            }
        }
        else {
            type = buildingMetaDict[selectedBuilding.meshName]["name"];
        };
        //tile_info_left[0].querySelector(".card-content-item-val").innerHTML = type;
        values[0].textContent = type;
        /* Update Water Level */
        // tile_info_left[1].querySelector(
        //     ".card-content-item-val").innerHTML 
        values[2].textContent = calculateWaterLevel(selectedTile.row, selectedTile.column) + " FT"; //groundTiles[selectedTile.row][selectedTile.column].type;
        /* Update #ofPeople */
        // tile_info_right[0].querySelector(
        //     ".card-content-item-val").innerHTML
        values[1].textContent = selectedBuilding.peopleOnIt;
        /* Update Risk Level */
        // tile_info_right[1].querySelector(
        //     ".card-content-item-val").innerHTML
        values[3].textContent = findRiskValue(selectedTile.row, selectedTile.column); //groundTiles[selectedTile.row][selectedTile.column].type;
    };


    function mitigationsActions() {

        /*
            This functions bind the actions for 
            each mitigation option with assigning onclick
            function to checkboxes.
            In order to interact with checkboxes,
            allCheckbox(array of checboxes obtanied through CSSSelector)
            is used.
        */

        // Add Structure
        allCheckbox[0].onclick = function() {
            // Create Building
            createBuilding(
                allMitigationsSelects[0].value,
                selectedTile.row,
                selectedTile.column);
            // Clear Selected Tile
            clearSelectedTile();
            // Add Cost
            expenses += mitigationMetaData["add_structure"]["opts_values"][allMitigationsSelects[0].value]["cost"];
            // Calculate Remaining Budget
            totalAvailableMoney -= mitigationMetaData["add_structure"]["opts_values"][allMitigationsSelects[0].value]["cost"];
            // Update Quick Facts Panel
            updateGameProgressPanel();
            updateGoalsPanel();
            // Update Main Game Panel
            uncheckAllMitigationStatus();
            showEmptyTileGUI(false);
            showBuildingTileGUI(false);
        };

        // Change Tile
        allCheckbox[1].onclick = function() {
            // Change Tile
            changeTileType(
                allMitigationsSelects[1].value,
                selectedTile.row,
                selectedTile.column
            );
            // Clear Selected Tile
            clearSelectedTile();
            // Add Cost
            expenses += mitigationMetaData["change_tile"]["opts_values"][allMitigationsSelects[1].value]["cost"];
            // Calculate Remaining Budget
            totalAvailableMoney -= mitigationMetaData["change_tile"]["opts_values"][allMitigationsSelects[1].value]["cost"];
            // Update Quick Facts Panel
            updateGameProgressPanel();
            updateGoalsPanel();
            // Update Main Game Panel
            // Unchecked checkbox
            uncheckMitigationStatus(mitigation_opts[1]);
        };

        // Flood Wall
        allCheckbox[2].onclick = function() {
            // Flood wall is applied 
            if (this.checked) {
                // Update tile information
                groundTiles[selectedTile.row][selectedTile.column].floodWall = parseInt(allMitigationsSelects[2].value);
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    // Add Cost
                    expenses += mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Calculate Remaning Budget
                    totalAvailableMoney -= mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                }
                else{
                    // Add Cost
                    expenses += mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * 500;
                    // Calculate Remaning Budget
                    totalAvailableMoney -= mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * 500;
                }
                // Update Quick Facts Panel
                updateGameProgressPanel();
                updateGoalsPanel();
                // Update Main Game Panel
                updateTileOptions(selectedTile.row, selectedTile.column);
                updateTileInformationPanel();
                // Disables Dropdown Menu
                // disableMitigationValue(mitigation_opts[2]);
            }
            // Flood wall is removed
            else {
                // Update tile information
                groundTiles[selectedTile.row][selectedTile.column].floodWall = 0;
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    // Add Cost
                    expenses -= mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Calculate Remaning Budget
                    totalAvailableMoney += mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                }
                else{
                    // Add Cost
                    expenses -= mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * 500;
                    // Calculate Remaning Budget
                    totalAvailableMoney += mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * 500;
                }
                // Update Quick Facts Panel
                updateGameProgressPanel();
                updateGoalsPanel();
                // Update Main Game Panel
                updateTileOptions(selectedTile.row, selectedTile.column);
                updateTileInformationPanel();
                // Enables Dropdown Menu
                //enableMitigationValue(mitigation_opts[2]);
            };
            updateFloodInformation();
        };


        // Sand Bag
        allCheckbox[3].onclick = function() {
            // Sand bag is applied
            if (this.checked) {
                // Update tile information
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    surfaceTiles[selectedTile.row][selectedTile.column].sandBag = parseInt(allMitigationsSelects[3].value);
                    // Add Cost
                    expenses += mitigationMetaDataNew["Sandbag"]["cost"][parseInt(allMitigationsSelects[3].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Calculate Remaining Budget
                    totalAvailableMoney -= mitigationMetaDataNew["Sandbag"]["cost"][parseInt(allMitigationsSelects[3].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Update Quick Facts Panel
                    updateGameProgressPanel();
                    updateGoalsPanel();
                    // Update Main Game Panel
                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();
                    // Disables Dropdown Menu
                    // disableMitigationValue(mitigation_opts[3]);
                }

            }
            // Sand bag is removed
            else {
                // Update tile information
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    surfaceTiles[selectedTile.row][selectedTile.column].sandBag = 0;
                    // Add Cost
                    expenses -= mitigationMetaDataNew["Sandbag"]["cost"][parseInt(allMitigationsSelects[3].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Calculate Remaining Budget
                    totalAvailableMoney += mitigationMetaDataNew["Sandbag"]["cost"][parseInt(allMitigationsSelects[3].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Update Quick Facts Panel
                    updateGameProgressPanel();
                    updateGoalsPanel();
                    // Update Quick Facts Panel
                    updateGameProgressPanel();
                    updateGoalsPanel();
                    // Update Main Game Panel
                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();
                }
            };
            updateFloodInformation();

        };

        // Insurance
        allCheckbox[4].onclick = function() {
            // Insurance is applied
            if (this.checked) {
                // Update tile information
                groundTiles[selectedTile.row][selectedTile.column].floodInsurance = true;
                // Add Cost
                expenses += mitigationMetaData["insurance"]["cost"];
                // Calculate Remaining Budget
                totalAvailableMoney -= mitigationMetaData["insurance"]["cost"];
                // Update Quick Facts Panel
                updateGameProgressPanel();
                updateGoalsPanel();
                // Update Main Game Panel
            }
            // Insurance is removed
            else {
                // Update tile information
                groundTiles[selectedTile.row][selectedTile.column].floodInsurance = false;
                // Add Cost
                expenses -= mitigationMetaData["insurance"]["cost"];
                // Calculate Remaining Budget
                totalAvailableMoney += mitigationMetaData["insurance"]["cost"];
                // Update Quick Facts Panel
                updateGameProgressPanel();
                updateGoalsPanel();
                // Update Main Game Panel
            };
        };

        // Relocate Structure
        allCheckbox[5].onclick = function() {
            selectedBuilding.isMove = true;
            expenses += mitigationMetaDataNew["Relocate"]["cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column].type]["Area"];
            totalAvailableMoney -= mitigationMetaDataNew["Relocate"]["cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column].type]["Area"];
        };
        // Remove Structure
        allCheckbox[6].onclick = function() {
            // Delete structure
            deleteBuilding();
            // Clear selected tile
            clearSelectedTile();
            // Add Cost
            expenses += mitigationMetaData["remove_structure"]["cost"];
            // Calculate Remaining Budget
            totalAvailableMoney -= mitigationMetaData["remove_structure"]["cost"];
            // Update Quick Facts Panel
            updateGameProgressPanel();
            updateGoalsPanel();

            // Update Main Game Panel
            uncheckAllMitigationStatus();
            showEmptyTileGUI(false);
            showBuildingTileGUI(false);
            updateFloodInformation();
        };
        // Elevate Structure
        allCheckbox[7].onclick = function() {
            if (this.checked) {
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    surfaceTiles[selectedTile.row][selectedTile.column].elevateStructure = parseInt(elevateStructureSlider[0].value);
                    
                    expenses += mitigationMetaDataNew["ElevateStructure"]["cost"][parseInt(elevateStructureSlider[0].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Area"];
                    totalAvailableMoney -= mitigationMetaDataNew["ElevateStructure"]["cost"][parseInt(elevateStructureSlider[0].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Area"];

                    
                    updateGameProgressPanel();
                    updateGoalsPanel();

                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();

                }
            }
            else {
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    surfaceTiles[selectedTile.row][selectedTile.column].elevateStructure = 0;

                    expenses -= mitigationMetaDataNew["ElevateStructure"]["cost"][parseInt(elevateStructureSlider[0].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Area"];
                    totalAvailableMoney += mitigationMetaDataNew["ElevateStructure"]["cost"][parseInt(elevateStructureSlider[0].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Area"];

                                        updateGameProgressPanel();
                    updateGoalsPanel();

                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();
                }
            }
        }
        // Wet Floodproofing
        
        allCheckbox[8].onclick = function() {
            // Wet Floodproofing is applied
            if (this.checked) {
                // Update tile information
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    surfaceTiles[selectedTile.row][selectedTile.column].Wetfloodproofing = parseInt(allMitigationsSelects[4].value);
                    // Add Cost
                    expenses += mitigationMetaDataNew["Wetfloodproofing"]["cost"][parseInt(allMitigationsSelects[4].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Calculate Remaining Budget
                    totalAvailableMoney -= mitigationMetaDataNew["Wetfloodproofing"]["cost"][parseInt(allMitigationsSelects[4].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Update Quick Facts Panel
                    updateGameProgressPanel();
                    updateGoalsPanel();

                    // Update Main Game Panel
                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();
                    // Disables Dropdown Menu
                    // disableMitigationValue(mitigation_opts[3]);
                }

            }
            //  Wet Floodproofing is removed
            else {
                // Update tile information
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    surfaceTiles[selectedTile.row][selectedTile.column].Wetfloodproofing = 0;
                    // Add Cost
                    expenses -= mitigationMetaDataNew["Wetfloodproofing"]["cost"][parseInt(allMitigationsSelects[4].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Calculate Remaining Budget
                    totalAvailableMoney += mitigationMetaDataNew["Wetfloodproofing"]["cost"][parseInt(allMitigationsSelects[4].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Update Quick Facts Panel
                    updateGameProgressPanel();
                    updateGoalsPanel();

                    // Update Main Game Panel
                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();
                }
            }
            updateFloodInformation();

        };
        // Dry Floodproofing
        allCheckbox[9].onclick = function() {
            // Dry Floodproofing is applied
            if (this.checked) {
                // Update tile information
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    surfaceTiles[selectedTile.row][selectedTile.column].Dryfloodproofing = parseInt(allMitigationsSelects[5].value);
                    // Add Cost
                    expenses += mitigationMetaDataNew["Dryfloodproofing"]["cost"][parseInt(allMitigationsSelects[5].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Calculate Remaining Budget
                    totalAvailableMoney -= mitigationMetaDataNew["Dryfloodproofing"]["cost"][parseInt(allMitigationsSelects[5].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Update Quick Facts Panel
                    updateGameProgressPanel();
                    updateGoalsPanel();

                    // Update Main Game Panel
                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();
                    // Disables Dropdown Menu
                    // disableMitigationValue(mitigation_opts[3]);
                }

            }
            //  Dry Floodproofing is removed
            else {
                // Update tile information
                if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                    surfaceTiles[selectedTile.row][selectedTile.column].Dryfloodproofing = 0;
                    // Add Cost
                    expenses -= mitigationMetaDataNew["Dryfloodproofing"]["cost"][parseInt(allMitigationsSelects[5].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Calculate Remaining Budget
                    totalAvailableMoney += mitigationMetaDataNew["Dryfloodproofing"]["cost"][parseInt(allMitigationsSelects[5].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"];
                    // Update Quick Facts Panel
                    updateGameProgressPanel();
                    updateGoalsPanel();

                    // Update Main Game Panel
                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();
                }
            }
            updateFloodInformation();

        };
        allCheckbox[10].onclick = function(){
            //console.log(allMitigationsSelects)
            createBuilding(
                allMitigationsSelects[6].value,
                selectedTile.row,
                selectedTile.column);
            // Clear Selected Tile
            clearSelectedTile();
            // Add Cost
            expenses += mitigationMetaData["add_structure"]["opts_values"][allMitigationsSelects[6].value]["cost"];
            // Calculate Remaining Budget
            totalAvailableMoney -= mitigationMetaData["add_structure"]["opts_values"][allMitigationsSelects[6].value]["cost"];
            // Update Quick Facts Panel
            updateGameProgressPanel();
            updateGoalsPanel();
            // Update Main Game Panel
            uncheckAllMitigationStatus();
            showEmptyTileGUI(false);
            showBuildingTileGUI(false);
        }
        
    }


    function calculateTotalDamage() {

        /*
            It calculates the total damage in terms of money
        */

        var totalBuilding = 0;
        var total = 0;
        var h = 0;
        updateFloodInformation();
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (obj != 0) {
                        if (isABuilding(surfaceTiles[row][column]["type"])){
                            h = Math.min(Math.round(obj.water_level), 24);
                            total += buildingMetaDict[surfaceTiles[row][column]["type"]]["Str_val"] *  buildingMetaDict[surfaceTiles[row][column]["type"]]["str_func"][h] * 0.01;
                            total += buildingMetaDict[surfaceTiles[row][column]["type"]]["Cont_val"] *  buildingMetaDict[surfaceTiles[row][column]["type"]]["cont_func"][h] * 0.01;

                        };   
                };
            };
        };

        return total;

    };


    function calculateInsurancedMoney() {
        /*
            It calculates the total money that
            will be received from the insurance in the system.
        */
        var totalBuilding = 0;
        var total = 0;
        updateFloodInformation();
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (obj != 0) {
                    if (obj.height > 0) {
                        if (groundTiles[row][column].floodInsurance) {
                            total++;
                            if (surfaceTiles[row][column] != 0) {
                                if (surfaceTiles[row][column].floodInsurance) {
                                    totalBuilding++;
                                };
                            };
                        };
                    };
                };
            };
        };
        return totalBuilding * 200 + total * 200;
    };

    function findNumberofEffectedPeople() {
        /*
            It calculates the number of people is affected by the flood.
        */

        var totalAffectedPeople = 0;
        var total = 0;
        updateFloodInformation();
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (surfaceTiles[row][column] != 0){
                    total += surfaceTiles[row][column].peopleOnIt;
                    if (obj != 0){
                        totalAffectedPeople += surfaceTiles[row][column].peopleOnIt;
                    };
                };
            };
        };
        return [total, totalAffectedPeople];

    };


    function clickButton(button_option){
        /*
            This function help to click any button in the game.
            Just add access and option to click.
        */

        var buttons = document.querySelectorAll(".button");

        // Start Button

        if (button_option == 0){
            buttons[0].click()
        };
        // Show Report Button
        if (button_option == 2){
            buttons[2].click()
        };

    };


    function buttonGUISetUp() {
        /*
            This function assigns the corresponding
            functionality for the buttons on the system.
            Buttons are selected with class name "gameButton".
        */
        var controlSection = document.querySelectorAll(".button");

        // Play Button
        controlSection[0].onclick = function() {
            // updateFloodInformation_v2();
            if (this.value == "start") {
                document.getElementById("clockDiv").style.display = "block";
                countdown("clockDiv", 10, 0);
                this.value = "finish";
                this.innerHTML = "Finish";
            } 
            else if (this.value == "finish"){
                clickButton(2);
                finishGame = 1000000;
                this.value = "again";
                this.innerHTML = "Start Again";
                            }
            else {
                
                window.location.reload();
            };
        }
        // Show Risk Button
        controlSection[1].onclick = function() {
            if (this.value == "true") {
                changeColorofRiskyAreas();
                this.innerHTML = "Clear Risky Areas";
                this.value = false;
            } else {
                clearColorOfRiskyRegions();
                this.innerHTML = "Show Risks";
                this.value = true;
            };
        };
        // Show Report Button
        controlSection[2].onclick = function() {
            updateGameProgressReport()
        };

        // Show Info Button
        controlSection[3].onclick = function() {

        };

        // Zoom Buttons Setup

        var zoomButtons = document.querySelectorAll(".zoomIcons");

        // Zoom Out
        zoomButtons[0].onclick = function(){
            zoomInOut(0);
        };

        // Zoom In
        zoomButtons[1].onclick = function(){
            zoomInOut(1);
        };


    };

    function zoomInOut(action){
        if (action == 1){
            if (zoom == 1){
                cameraControls.zoom(0.25, true);
                zoom += 1;
            }
            else if (zoom < 3){
                cameraControls.zoom(0.5, true);
                zoom += 1;
            }
            else{};
        }
        else {
            if (zoom == 2){
                cameraControls.zoom(-0.25, true);
                zoom -= 1;
            }
            else if (zoom > 1){
                cameraControls.zoom(-0.5, true);
                zoom -= 1;
            }
            else{};
        };
    };

};


var dictOfDefaultMaps = {

    'iowa_city': [
        "sources/maps/iowa_city/GroundTiles.json",
        "sources/maps/iowa_city/SurfaceTiles.json",
        "sources/maps/iowa_city/SurfaceTiles_v2.json",
        "sources/FloodTiles.json"
    ],
    'cedar_rapids': [
        "sources/maps/cedar_rapids/GroundTiles.json",
        "sources/maps/cedar_rapids/SurfaceTiles.json",
        "sources/maps/cedar_rapids/SurfaceTiles_v2.json",
        "sources/FloodTiles.json"
    ],
    'des_moines': [
        "sources/maps/des_moines/GroundTiles.json",
        "sources/maps/des_moines/SurfaceTiles.json",
        "sources/maps/des_moines/SurfaceTiles_v2.json",
        "sources/FloodTiles.json"
    ],
    'davenport': [
        "sources/maps/davenport/GroundTiles.json",
        "sources/maps/davenport/SurfaceTiles.json",
        "sources/maps/davenport/SurfaceTiles_v2.json",
        "sources/FloodTiles.json"
    ],
    'greenville': [
        "sources/maps/greenville/GroundTiles.json?v=4",
        "sources/maps/greenville/SurfaceTiles.json?v=4",
        "sources/maps/greenville/SurfaceTiles_v2.json?v=4",
        "sources/FloodTiles.json"
    ],
    'st_bernard': [
        "sources/maps/st_bernard/GroundTiles.json?v=4",
        "sources/maps/st_bernard/SurfaceTiles.json?v=4",
        "sources/maps/st_bernard/SurfaceTiles_v2.json?v=4",
        "sources/FloodTiles.json"
    ],
};


//main();



function clearMapsUI(){
    document.getElementById("modal-js-example").classList.add("is-hidden");
};

function showMapsUI(){
    document.getElementById("modal-js-example").classList.remove("is-hidden");
};

function startGame(name){
    if (name[0] == 0){
        main(0, dictOfDefaultMaps[name[1]], name[2]);
        clearMapsUI();
    }
    else{
        main(1, name[1], name[2]);
        clearMapsUI();
        //createAutomaticMapData(name[1]);
       //alert("Automatic Map Generation is under development!!!")
    }
};


async function receiveImageFromGoogleMaps(location){
    /*
        This function receives center of rectangle as input, then
        it receives Google Maps image and place it to a canvas with
        desired resolution.
    */
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d", {colorSpace: 'srgb'});
    var img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = `https://maps.googleapis.com/maps/api/staticmap?key=AIzaSyAi9ZclWNZruhG2e3mmR9GtH3p-V0dXgps&center=${location}&zoom=15&format=png&maptype=roadmap&style=element:labels%7Cvisibility:off&style=feature:administrative.land_parcel%7Cvisibility:off&style=feature:administrative.neighborhood%7Cvisibility:off&style=feature:poi.business%7Celement:geometry%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.business%7Celement:geometry.fill%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.business%7Celement:geometry.stroke%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.medical%7Celement:geometry%7Ccolor:0xf9e8ea%7Cvisibility:on&style=feature:poi.medical%7Celement:geometry.fill%7Ccolor:0xf9e8ea&style=feature:poi.medical%7Celement:geometry.stroke%7Ccolor:0xf9e8ea&style=feature:poi.park%7Celement:geometry%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.park%7Celement:geometry.fill%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.park%7Celement:geometry.stroke%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.school%7Celement:geometry%7Ccolor:0xedf0f3%7Cvisibility:on&style=feature:poi.sports_complex%7Celement:geometry%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.sports_complex%7Celement:geometry.fill%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.sports_complex%7Celement:geometry.stroke%7Ccolor:0xbae4b9&style=feature:road%7Celement:geometry.fill%7Ccolor:0xfefefe%7Cvisibility:on&style=feature:road%7Celement:geometry.stroke%7Ccolor:0xffffff%7Cvisibility:on&style=feature:road.arterial%7Celement:labels%7Cvisibility:off&style=feature:road.highway%7Celement:labels%7Cvisibility:off&style=feature:road.local%7Cvisibility:off&style=feature:transit.line%7Celement:geometry.fill%7Cvisibility:off&style=feature:transit.line%7Celement:geometry.stroke%7Cvisibility:off&style=feature:transit.station%7Celement:geometry%7Ccolor:0xedf0f3%7Cvisibility:on&style=feature:water%7Celement:geometry%7Ccolor:0x9bd0fe%7Cvisibility:on&style=feature:water%7Celement:geometry.fill%7Ccolor:0x9bd0fe%7Cvisibility:on&style=feature:water%7Celement:geometry.stroke%7Ccolor:0x9bd0fe%7Cvisibility:on&size=400x400`

    img.onload = function(){
        ctx.drawImage(img, 0, 0, 400, 380, 0, 0, 50, 50);
    };
    //img.src = `https://maps.googleapis.com/maps/api/staticmap?key=AIzaSyAi9ZclWNZruhG2e3mmR9GtH3p-V0dXgps&center=${location}&zoom=15&format=png&maptype=roadmap&style=element:labels%7Cvisibility:off&style=feature:administrative.land_parcel%7Cvisibility:off&style=feature:administrative.neighborhood%7Cvisibility:off&style=feature:poi.business%7Cvisibility:off&style=feature:road%7Celement:labels.icon%7Cvisibility:off&style=feature:road.arterial%7Celement:labels%7Cvisibility:off&style=feature:road.highway%7Celement:labels%7Cvisibility:off&style=feature:road.local%7Cvisibility:off&style=feature:transit%7Cvisibility:off&size=400x400`;
};


async function readGoogleMapsDataFromCanvas(){
    /*
        This function reads image data from canvas.
    */
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d", {colorSpace: 'srgb'});
    var imgData = ctx.getImageData(0, 0, 50, 50, {colorSpace: 'srgb'});
    return imgData;
};


function RGBAtoRGB(r, g, b, a, opt){
    /*
        This function takes RGBA values of a pixel in Google Maps Image
        and then convert to RGB values. 
        opt = 1 means RGB background is white
        opt = else means RGB background is black
    */
    
    var r2, g2, b2, alpha;
    if (opt == 1){
        r2 = 255;
        g2 = 255;
        b2 = 255;
    }
    else{
        r2 = 0;
        g2 = 0;
        b2 = 0;
    };

    alpha = a / 255;

    var r3 = Math.round(((1 - alpha) * r2) + (alpha * r))
    var g3 = Math.round(((1 - alpha) * g2) + (alpha * g))
    var b3 = Math.round(((1 - alpha) * b2) + (alpha * b))
    return [r3, g3, b3];
};



function imageDatatoRGB(imgData){
    /*
        This functions takes image data as rgba in one array and converts
        to 2d array with rgb values.
    */
    var index, tempResult;
    var imageto2dRGB = [];
    var imgDataHeight = imgData.height;
    var imgDataWidth = imgData.width;
    var pixelValues = imgData.data;
    
    for (var row = 0; row < imgDataWidth; row++){
        imageto2dRGB.push([]);
        for (var column = 0; column < imgDataHeight; column++){
            index = row * (imgDataWidth * 4) + column * 4;
            tempResult = RGBAtoRGB(
                pixelValues[index],
                pixelValues[index + 1],
                pixelValues[index + 2],
                pixelValues[index + 3],
                1
                )
            imageto2dRGB[row].push(tempResult)
        };
    };
    return imageto2dRGB;
};


function findDifferences(array1, array2){
    /*
        This function returns MSE error between two arrays.
    */

    var value = 0;
    
    for (var i = 0; i < array1.length; i++){
        value += (array1[i] - array2[i])**2
    };

    return value / array1.length;
};


var colorCodesForMaps = {
    0: [254, 254, 254], // Road 
    1: [249, 232, 234], // Hospital
    2: [254, 247, 224], // Commercial
    3: [185, 228, 185], // Parks
    4: [241, 243, 244], // Res
    5: [238, 240, 243], // Res 2
    6: [155, 209, 254], // Water
};


function bestMatchColorCode(pixelValues, colorCodesForMaps){
    /*
        This function takes pixelValues and color codes as input
        and returns best match for given pixel values.
        pixelValues -> array of pixel values -> [r, g, b]
        colorCodesForMaps -> dict of pixel values -> id: [r, g, b]
    */

    var ids = Object.keys(colorCodesForMaps);
    var minDifference = 100000000000000000;
    var id = ids[0];

    ids.forEach(function (item){
        if (minDifference > findDifferences(pixelValues, colorCodesForMaps[item])){
            minDifference = findDifferences(pixelValues, colorCodesForMaps[item]);
            id = item;
        };
    });
    if (id == 4 || id == 5 || id == 1 || id == 2){
        if (Math.random() > 0.2){
            id = 3;
        };
    };
    
    return id;
};


function RGBtoObjectIds(pixelValuesRGB, colorCodesForMaps){
    /*
        This function takes 100x100 RGB values of an image and convert to ids of
        different object types.
        pixelValues -> array of pixel values -> [r, g, b]
        colorCodesForMaps -> dict of pixel values -> id: [r, g, b]
    */

    var pixeltoIds = [];
    var rowNumber = pixelValuesRGB.length;
    var columnNumber = pixelValuesRGB[0].length;
    
    for (var row = 0; row < rowNumber; row++){
        pixeltoIds.push([]);
        for (var column = 0; column < columnNumber; column++){
            pixeltoIds[row].push(
                bestMatchColorCode(pixelValuesRGB[row][column], colorCodesForMaps)
                )
        };
    };

    return pixeltoIds;
};



function RGBtoMaps(pixelValuesRGB, colorCodesForMaps){
    /*
        This function takes 100x100 RGB values of an image and convert to
        map data.
    */

    var index, tempResult;
    var imageto2dRGB = [];
    var imgDataHeight = pixelValuesRGB.length;
    var imgDataWidth = pixelValuesRGB[0].length;
    
    for (var row = 0; row < imgDataWidth; row++){
        imageto2dRGB.push([]);
        for (var column = 0; column < imgDataHeight; column++){
            imageto2dRGB[row].push(
                bestMatchColorCode(pixelValuesRGB[row][column], colorCodesForMaps)
                )
        };
    };
    return imageto2dRGB;
};


function groundTile (row, column, elevation, typee, instanceId, floodwall){
    var t = {};
    t["row"] = row;
    t["column"] = column;
    t["elevation"] = elevation;
    t["type"] = typee;
    t["instanceId"] = instanceId;
    t["floodWall"] = floodwall;
    return t;
};


function surfaceTile(row, column, elevation, typee, instanceId, peopleOnIt=5, height=100){
    var t = {};
    t["row"] = row;
    t["height"] = height;
    t["column"] = column;
    t["elevation"] = elevation;
    t["type"] = typee;
    t["instanceId"] = instanceId;
    t["peopleOnIt"] = peopleOnIt;
    t["elevateStructure"] = 0;
    t["floodInsurance"] = 0;
    t["Dryfloodproofing"] = 0;
    t["Wetfloodproofing"] = 0;
    t["sandBag"] = 0;
    return t;
};


function floodTile (row, column, elevation, typee, instanceId, water_level, floodLevel=74){
    var t = {};
    t["row"] = row;
    t["column"] = column;
    t["elevation"] = elevation;
    t["type"] = typee;
    t["instanceId"] = instanceId;
    t["water_level"] = water_level;
    t["flood_level"] = 74;
    return t;
};


function neighboor(i, j){
    var a = [1, 1, 1, 1, 1];

    if (i - 1 < 0 || i + 1 == 50 || j - 1 < 0 || j + 1 == 50){
        a[0] = 0;
    };
    if (i - 1 < 0){
        a[1] = 0;
    };
    if (i + 1 == 50){
        a[2] = 0;
    };
    if (j - 1 < 0){
        a[3] = 0;
    };
    if (j + 1 == 50){
        a[4] = 0;
    };
    return a;
};

function isRoad(i, j, arrayName){
    if (arrayName[i][j]["type"] == "road"){
        return true;
    }
    else{
        return false;
    };
};

function isCenter(i, j, arrayName){
    var a = neighboor(i, j)
    if (a[0] == 1){
        if (isRoad(i - 1, j, arrayName) && isRoad(i + 1, j, arrayName) && isRoad(i, j - 1, arrayName) && isRoad(i, j + 1, arrayName)){
            return true;
        }
        else{
            return false;
        };
    }
    else{
        return false;
    };
};

function isHorizontal(i, j, arrayName){
    var a = neighboor(i, j)
    if (a[1] == 1){
        if (isRoad(i - 1, j, arrayName)){
            return true;
        };
    };
    if (a[2] == 1){
        if (isRoad(i + 1, j, arrayName)){
            return true;
        };
    };
    return false;
};

function isVertical(i, j, arrayName){
    var a = neighboor(i, j)
    if (a[3] == 1){
        if (isRoad(i, j - 1, arrayName)){
            return true;
        };
    };
    if (a[4] == 1){
        if (isRoad(i, j + 1, arrayName)){
            return true;
        };
    };
    return false;
};

function findRoadType(i, j, arrayName){
    /*
        This function finds the road's type */

    var b = checkNeighborRoads(i, j, arrayName);

    if (b[0] == 4){
        return "road_c";
    }
    else if (b[0] == 1){
        return findRoadTypefor1(b);
    }
    else if (b[0] == 2){
        return findRoadTypefor2(b);
    }
    else if (b[0] == 3){
        return findRoadTypefor3(b);
    }
    else {
        //console.log("Error findRoadType");
        return "road_c";
    };
};


function findRoadTypefor3(b){
    /*
        b -> [sum, left-hor, right-hor, up-ver, down-ver]
        i - 1, i + 1 => horizantal
        j - 1, j + 1 => vertical

    */

    // hor-left + hor-right + up-ver
    if (b[1] == 1 && b[2] == 1 && b[3] == 1){
        return "road_up_down_right_3";
    }
    // hor-left + hor-right + down-ver
    else if (b[1] == 1 && b[2] == 1 && b[4] == 1){
        return "road_up_down_left_3";
    }
    // up-ver + down-ver + left-hor
    else if (b[3] == 1 && b[4] == 1 && b[1] == 1){
        return "road_left_right_down_3";
    }
    // up-ver + down-ver + right-hor
    else if (b[3] == 1 && b[4] == 1 && b[2] == 1){
        return "road_left_right_up_3";
    }
    else{
        //console.log("Error on Type 3");
        return "road_h";
    };
};


function findRoadTypefor2(b){
    /*
        b -> [sum, left-hor, right-hor, up-ver, down-ver]
        i - 1, i + 1 => horizantal
        j - 1, j + 1 => vertical

    */

    // Horizantal
    if (b[1] == 1 && b[2] == 1){
        return "road_h";
    }
    // Vertical
    else if (b[3] == 1 && b[4] == 1){
        return "road_v";
    }
    // left and up
    else if (b[1] == 1 && b[3] == 1){
        return "road_right_down_2";
    }
    // left and down
    else if (b[1] == 1 && b[4] == 1){
        return "road_left_down_2";
    }
    // right and up
    else if (b[2] == 1 && b[3] == 1){
        return "road_right_up_2";
    }
    // right and down
    else if (b[2] == 1 && b[4] == 1){
        return "road_left_up_2";
    }
    else{
        //console.log("Error on Type 1");
        return "road_h";
    };
};

function findRoadTypefor1(b){
    /*
        b -> [sum, left-hor, right-hor, up-ver, down-ver]
        i - 1, i + 1 => horizantal
        j - 1, j + 1 => vertical

    */

    if (b[1] == 1){
        return "road_v_down_1";
    }
    else if (b[2] == 1){
        return "road_v_up_1";
    }
    else if (b[3] == 1){
        return "road_h_right_1";
    }
    else if (b[4] == 1){
        return "road_h_left_1";
    }
    else {
        //console.log("Error on Type 1")
        return "road_h";
    };

};


function checkNeighborRoads(i, j, arrayName){
    /*
        This function finds neighbor roads.
        returns:
            [x1-x4] => 0 or 1;
            b -> [x0, x1, x2, x3, x4]
            x0 = how many roads around the point 

            i - 1, i + 1 => horizantal
            j - 1, j + 1 => vertical
            j => column
            i = row
    */

    var a = neighboor(i, j);
    var b = [0, 0, 0, 0, 0];

    if (a[1]){
        if (isRoad(i - 1, j, arrayName)){
            b[1] = 1;
        };
    };

    if (a[2]){
        if (isRoad(i + 1, j, arrayName)){
            b[2] = 1;
        };
    };

    if (a[3]){
        if (isRoad(i, j - 1, arrayName)){
            b[3] = 1;
        };
    };

    if (a[4]){
        if (isRoad(i, j + 1, arrayName)){
            b[4] = 1;
        };
    };

    b[0] = b[1] + b[2] + b[3] + b[4];
    return b;
};

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

function idstoGroundTiles(objectIds){
    /*
        This function takes the map as object ids and 
        creates groundtiles.
        objectIds -> 50x50 -> [0 (Road), 1 (Hospital), 2 (Commercial), 3 (Parks), 4 (Res), 5 (Res 2), 6 (Water)]
    */

    var groundTileArray = [];
    var surfaceTileArray = [];
    var surfaceTileArray_2 = [];
    var floodTileArray = [];

    for (var i = 0; i < 50; i++){
        groundTileArray.push([]);
        for (var j = 0; j < 50; j++){
            if (objectIds[i][j] == 6){
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(55, 60),
                        "water",
                        0,
                        0
                        )
                    );
            }
            else if (objectIds[i][j] == 0){
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(70, 75),
                        "road",
                        0,
                        0
                        )
                    );   
            }
            else if (objectIds[i][j] == 1 || objectIds[i][j] == 2 || objectIds[i][j] == 4 || objectIds[i][j] == 5){
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(70, 75),
                        "building",
                        0,
                        0
                        )
                    );   
            }
            else if (objectIds[i][j] == 3){
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(70, 75),
                        "parks",
                        0,
                        0
                        )
                    ); 
            }
            else {
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(70, 75),
                        "parks",
                        0,
                        0
                        )
                    ); 
            };

        };
    };

    for (var i = 0; i < 50; i++){
        surfaceTileArray.push([]);
        for (var j = 0; j < 50; j++){
            if (objectIds[i][j] == 1){
                surfaceTileArray[i].push(
                    surfaceTile(i, j, groundTileArray[i][j]["elevation"], "Hos", 0)
                )
            }
            else if (objectIds[i][j] == 2){
                surfaceTileArray[i].push(
                    surfaceTile(i, j, groundTileArray[i][j]["elevation"], "Com", 0)
                )
            }
            else if (objectIds[i][j] == 4 || objectIds[i][j] == 5){
                var a = Math.random();
                var b = "Res3";
                if (a > 0.7){
                    b = "Res1";
                    surfaceTileArray[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], b, 0, 5)
                    )

                }
                else if (a > 0.4){
                    b = "Res2";
                    surfaceTileArray[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], b, 0, 20)
                    )

                }
                else{
                    b = "Res3";
                    surfaceTileArray[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], b, 0, 40)
                    )

                };
            }
            else{
                surfaceTileArray[i].push(0);
            }
        };
    };

    for (var i = 0; i < 50; i++){
        surfaceTileArray_2.push([]);
        for (var j = 0; j < 50; j++){
            if (groundTileArray[i][j]["type"] == "building"){
                surfaceTileArray_2[i].push(0);
            }
            else if (groundTileArray[i][j]["type"] == "road"){
                var name_of_road = findRoadType(i, j, groundTileArray);
                if (name_of_road == "road_v"){
                    surfaceTileArray_2[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], "road_v", [])
                        );

                }
                else if (name_of_road == "road_h"){

                    surfaceTileArray_2[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], "road_h", [])
                        );         
                }

                else {
                    surfaceTileArray_2[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], name_of_road, 0)
                        );

                };
                // if (isCenter(i, j, groundTileArray)){
                //     surfaceTileArray_2[i].push(
                //         surfaceTile(i, j, groundTileArray[i][j]["elevation"], "road_c", 0)
                //         );
                // }
                // else if (isVertical(i, j, groundTileArray)){
                //     surfaceTileArray_2[i].push(
                //         surfaceTile(i, j, groundTileArray[i][j]["elevation"], "road_v", [])
                //         );
                // }
                // else{
                //     surfaceTileArray_2[i].push(
                //         surfaceTile(i, j, groundTileArray[i][j]["elevation"], "road_h", [])
                //         );         
                // };
            }
            else if (groundTileArray[i][j]["type"] == "parks"){
                if (Math.random() > 0.4){
                    surfaceTileArray_2[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], "tree", [])
                    );
                }
                else{
                    surfaceTileArray_2[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], "tree2", [])
                    );

                }
            }
            else if (groundTileArray[i][j]["type"] == "parking_lot"){
                surfaceTileArray_2[i].push(
                    surfaceTile(i, j, groundTileArray[i][j]["elevation"], "parking", 0)
                    );          
            }
            else{
                surfaceTileArray_2[i].push(0);
            }
        };
    };

    for (var i = 0; i < 50; i++){
        floodTileArray.push([])
        for (var j = 0; j < 50; j++){
            floodTileArray[i].push(0);
        };
    };

    var countMap = {};

    // Ground Tiles
    countMap["water"] = 50;
    countMap["building"] = 50;
    countMap["road"] = 50;
    countMap["parks"] = 50;
    countMap["parking_lot"] = 50;


    // Surface Tiles v2
    countMap["road_v"] = 100;
    countMap["road_h"] = 100;
    countMap["road_c"] = 5;
    countMap["tree"] = 1000;
    countMap["tree2"] = 1000;
    countMap["parking"] = 20;
    countMap["flood"] = 5000;

    countMap["road_h_left_1"] = 100;
    countMap["road_h_right_1"] = 100;
    countMap["road_v_up_1"] = 100;
    countMap["road_v_down_1"] = 100;

    countMap["road_left_up_2"] = 100;
    countMap["road_left_down_2"] = 100;
    countMap["road_right_up_2"] = 100;
    countMap["road_right_down_2"] = 100;

    countMap["road_left_right_up_3"] = 100;
    countMap["road_left_right_down_3"] = 100;
    countMap["road_up_down_left_3"] = 100;
    countMap["road_up_down_right_3"] = 100;


    // Surface Tiles
    countMap["Res1"] = 50;
    countMap["Res2"] = 50;
    countMap["Res3"] = 50;
    countMap["Pol"] = 1;
    countMap["Fire"] = 1;
    countMap["Hos"] = 1;
    countMap["School"] = 1;
    countMap["Wat"] = 1;
    countMap["Ind"] = 1;
    countMap["Com"] = 1;
    countMap["Shel1"] = 3;
    countMap["Shel2"] = 3;
    countMap["Shel3"] = 3;

    for (var row = 0; row < 50; row++){
        for (var column = 0; column < 50; column++){
            
            countMap[groundTileArray[row][column]["type"]]++;
            
            if (surfaceTileArray[row][column] != 0){
                if (isInstancing(surfaceTileArray[row][column]["type"])){
                    countMap[surfaceTileArray[row][column]["type"]]++;
                };
            };

            if (surfaceTileArray_2[row][column] != 0){
                if (surfaceTileArray_2[row][column]["type"] == "tree"){countMap[surfaceTileArray_2[row][column]["type"]] += 4}
                else if (surfaceTileArray_2[row][column]["type"] == "tree2"){countMap[surfaceTileArray_2[row][column]["type"]] += 4}
                else if (surfaceTileArray_2[row][column]["type"] == "road_h"){countMap[surfaceTileArray_2[row][column]["type"]] += 2}
                else if (surfaceTileArray_2[row][column]["type"] == "road_v"){countMap[surfaceTileArray_2[row][column]["type"]] += 2}
                else if (surfaceTileArray_2[row][column]["type"] == "road_c"){countMap[surfaceTileArray_2[row][column]["type"]] += 1}
                else if (surfaceTileArray_2[row][column]["type"] == "parking"){countMap[surfaceTileArray_2[row][column]["type"]] += 1}
                else {countMap[surfaceTileArray_2[row][column]["type"]] += 2};
                
            };

            if (floodTileArray[row][column] != 0){
                countMap["flood"]++
            };
        };
    };

    return [groundTileArray, surfaceTileArray, surfaceTileArray_2, floodTileArray, countMap]; 
};

function isInstancing(name){
    /*
        if object is added to scene with non-instancing method, returns false.
    */
    if (name == "Res1" || name == "Res2" || name == "Res3" || name == "Hos" || name == "School" || name == "Pol" || name == "Com" || name == "Fire"){
        return false;
    };
    return true;
};


function pixelValuesToSurfaceType(pixelValues){
    /*
        This function convert pixel values to surface type.

        pixelValues -> array of pixel values -> [r, g, b]
    */


};

function pixelValuesToGroundType(pixelValues){
    /*
        This function convert pixel values to ground type.

        pixelValues -> array of pixel values -> [r, g, b]
    */

};



function pixelValuesToMap(pixelValuesRGB){
    /*
        This function takes RGB pixel values and creates map data.
    */

    var row, column;


};


async function createAutomaticMapData(locations){
    var imgData, pixelValuesRGB, pixeltoIds;
    var location = locations.substring(1, locations.length - 1);
    await receiveImageFromGoogleMaps(location);
    await delay(1000);
    imgData = await readGoogleMapsDataFromCanvas();
    pixelValuesRGB = await imageDatatoRGB(imgData);
    pixeltoIds = RGBtoObjectIds(pixelValuesRGB, colorCodesForMaps);
    return idstoGroundTiles(pixeltoIds);
};

// async function createAutomaticMapData(locations){
//     var pixeltoIds, pixeltoIdss;
//     var location = locations.substring(1, locations.length - 1);
//     var pixeltoIds = await testGoogleImage(location);
//     await delay(1000);
//     return testidstoGroundTiles(pixeltoIds);   
// };



function testidstoGroundTiles(objectIds){
    /*
        This function takes the map as object ids and 
        creates groundtiles.
        objectIds -> 50x50 -> [0 (Road), 1 (Hospital), 2 (Commercial), 3 (Parks), 4 (Res), 5 (Res 2), 6 (Water)]
    
    // TILE CODES
    // 0 = Land
    // 1 = Road
    // 2 = Building
    // 3 = Blue
    // 4 = Levee (THIS IS NOT AVAILABLE IN THE GENERATED MAP; it's only used for flood simulation)
    // 5 = Trees/Vegetation

    */

    var groundTileArray = [];
    var surfaceTileArray = [];
    var surfaceTileArray_2 = [];
    var floodTileArray = [];

    for (var i = 0; i < 50; i++){
        groundTileArray.push([]);
        for (var j = 0; j < 50; j++){
            if (objectIds[i][j] == 3){
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(55, 60),
                        "water",
                        0,
                        0
                        )
                    );
            }
            else if (objectIds[i][j] == 1){
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(70, 75),
                        "road",
                        0,
                        0
                        )
                    );   
            }
            else if ( objectIds[i][j] == 2){
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(70, 75),
                        "building",
                        0,
                        0
                        )
                    );   
            }
            else if (objectIds[i][j] == 5){
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(70, 75),
                        "parks",
                        0,
                        0
                        )
                    ); 
            }
            else {
                groundTileArray[i].push(
                    groundTile(
                        i,
                        j,
                        getRndInteger(70, 75),
                        "parks",
                        0,
                        0
                        )
                    ); 
            };

        };
    };

    for (var i = 0; i < 50; i++){
        surfaceTileArray.push([]);
        for (var j = 0; j < 50; j++){
            if (objectIds[i][j] == 2){
                var a = Math.random();
                var b = "Res3";
                if (a > 0.8){
                    b = "Res1";
                    surfaceTileArray[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], b, 0, 5)
                    )

                }
                else if (a > 0.6){
                    b = "Res2";
                    surfaceTileArray[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], b, 0, 20)
                    )

                }
                else if (a > 0.4){
                    b = "Hos";
                    surfaceTileArray[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], b, 0, 20)
                    )

                }
                else if (a > 0.2){
                    b = "Com";
                    surfaceTileArray[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], b, 0, 20)
                    )

                }
                else{
                    b = "Res3";
                    surfaceTileArray[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], b, 0, 40)
                    )

                };
            }
            else{
                surfaceTileArray[i].push(0);
            }
        };
    };

    for (var i = 0; i < 50; i++){
        surfaceTileArray_2.push([]);
        for (var j = 0; j < 50; j++){
            if (groundTileArray[i][j]["type"] == "building"){
                surfaceTileArray_2[i].push(0);
            }
            else if (groundTileArray[i][j]["type"] == "road"){
                if (isCenter(i, j, groundTileArray)){
                    surfaceTileArray_2[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], "road_c", 0)
                        );
                }
                else if (isVertical(i, j, groundTileArray)){
                    surfaceTileArray_2[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], "road_v", [])
                        );
                }
                else{
                    surfaceTileArray_2[i].push(
                        surfaceTile(i, j, groundTileArray[i][j]["elevation"], "road_h", [])
                        );         
                };
            }
            else if (groundTileArray[i][j]["type"] == "parks"){
                surfaceTileArray_2[i].push(
                    surfaceTile(i, j, groundTileArray[i][j]["elevation"], "tree", [])
                    );
            }
            else if (groundTileArray[i][j]["type"] == "parking_lot"){
                surfaceTileArray_2[i].push(
                    surfaceTile(i, j, groundTileArray[i][j]["elevation"], "parking", 0)
                    );          
            }
            else{
                surfaceTileArray_2[i].push(0);
            }
        };
    };

    for (var i = 0; i < 50; i++){
        floodTileArray.push([])
        for (var j = 0; j < 50; j++){
            floodTileArray[i].push(0);
        };
    };

    var countMap = {};

    // Ground Tiles
    countMap["water"] = 50;
    countMap["building"] = 50;
    countMap["road"] = 50;
    countMap["parks"] = 50;
    countMap["parking_lot"] = 50;


    // Surface Tiles v2
    countMap["road_v"] = 100;
    countMap["road_h"] = 100;
    countMap["road_c"] = 5;
    countMap["tree"] = 1000;
    countMap["parking"] = 20;
    countMap["flood"] = 5000;

    // Surface Tiles
    countMap["Res1"] = 50;
    countMap["Res2"] = 50;
    countMap["Res3"] = 50;
    countMap["Pol"] = 1;
    countMap["Fire"] = 1;
    countMap["Hos"] = 1;
    countMap["School"] = 1;
    countMap["Wat"] = 1;
    countMap["Ind"] = 1;
    countMap["Com"] = 1;
    countMap["Shel1"] = 3;
    countMap["Shel2"] = 3;
    countMap["Shel3"] = 3;

    for (var row = 0; row < 50; row++){
        for (var column = 0; column < 50; column++){
            
            countMap[groundTileArray[row][column]["type"]]++;
            
            if (surfaceTileArray[row][column] != 0){
                countMap[surfaceTileArray[row][column]["type"]]++;
            };

            if (surfaceTileArray_2[row][column] != 0){
                if (surfaceTileArray_2[row][column]["type"] == "tree"){countMap[surfaceTileArray_2[row][column]["type"]] += 8}
                else if (surfaceTileArray_2[row][column]["type"] == "tree2"){countMap[surfaceTileArray_2[row][column]["type2"]] += 8}
                else if (surfaceTileArray_2[row][column]["type"] == "road_h"){countMap[surfaceTileArray_2[row][column]["type"]] += 2}
                else if (surfaceTileArray_2[row][column]["type"] == "road_v"){countMap[surfaceTileArray_2[row][column]["type"]] += 2}
                else if (surfaceTileArray_2[row][column]["type"] == "road_c"){countMap[surfaceTileArray_2[row][column]["type"]] += 1}
                else if (surfaceTileArray_2[row][column]["type"] == "parking"){countMap[surfaceTileArray_2[row][column]["type"]] += 1}
                else {countMap[surfaceTileArray_2[row][column]["type"]] += 2};
                
            };

            if (floodTileArray[row][column] != 0){
                countMap["flood"]++
            };
        };
    };

    return [groundTileArray, surfaceTileArray, surfaceTileArray_2, floodTileArray, countMap]; 
};


function testGoogleImage(location){
    function Point(r,g,b){
        this.r = r;
        this.g = g;
        this.b = b;
    };

    var colorDict = {};

    // TILE CODES
    // 0 = Land
    // 1 = Road
    // 2 = Building
    // 3 = Blue
    // 4 = Levee (THIS IS NOT AVAILABLE IN THE GENERATED MAP; it's only used for flood simulation)
    // 5 = Trees/Vegetation

    // pre stored color - tile
    colorDict[JSON.stringify(new Point(248,249,250))]=0;
    colorDict[JSON.stringify(new Point(255,232,151))]=1;
    colorDict[JSON.stringify(new Point(255,255,255))]=1;
    colorDict[JSON.stringify(new Point(255,242,175))]=1;
    colorDict[JSON.stringify(new Point(247,234,234))]=2;
    colorDict[JSON.stringify(new Point(238,238,238))]=2;
    colorDict[JSON.stringify(new Point(160,213,255))]=3;
    colorDict[JSON.stringify(new Point(170,218,255))]=3;
    colorDict[JSON.stringify(new Point(193,231,193))]=5;
    colorDict[JSON.stringify(new Point(140,239,138))]=5;
    colorDict[JSON.stringify(new Point(173,222,173))]=5; 

    const threshold     = 25;
    const mapDimension  = 500;
    const tileDimension = mapDimension/10;
    const zoomLevel     = 17;

    var pixelArr = new Array(mapDimension);

    for(let i=0;i < pixelArr.length; i++){
        pixelArr[i] = new Array(mapDimension);
    };

    var trimedPixelArr = new Array(tileDimension);
    for(let i=0;i < trimedPixelArr.length; i++){
        trimedPixelArr[i] = new Array(tileDimension);
    };

    // 2d array to store the result of gamemap you create
    var gameMap = new Array(tileDimension);
    for(let i=0;i < gameMap.length; i++){
        gameMap[i] = new Array(tileDimension);
    };


    var img = document.getElementById("google-image");
    img.src = `https://maps.googleapis.com/maps/api/staticmap?center=${location}&zoom=${zoomLevel}&size=640x640&key=AIzaSyAi9ZclWNZruhG2e3mmR9GtH3p-V0dXgps&style=feature:all|element:labels|visibility:off`
    //img.src = `https://maps.googleapis.com/maps/api/staticmap?key=AIzaSyAi9ZclWNZruhG2e3mmR9GtH3p-V0dXgps&center=${location}&zoom=15&format=png&maptype=roadmap&style=element:labels%7Cvisibility:off&style=feature:administrative.land_parcel%7Cvisibility:off&style=feature:administrative.neighborhood%7Cvisibility:off&style=feature:poi.business%7Celement:geometry%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.business%7Celement:geometry.fill%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.business%7Celement:geometry.stroke%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.medical%7Celement:geometry%7Ccolor:0xf9e8ea%7Cvisibility:on&style=feature:poi.medical%7Celement:geometry.fill%7Ccolor:0xf9e8ea&style=feature:poi.medical%7Celement:geometry.stroke%7Ccolor:0xf9e8ea&style=feature:poi.park%7Celement:geometry%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.park%7Celement:geometry.fill%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.park%7Celement:geometry.stroke%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.school%7Celement:geometry%7Ccolor:0xedf0f3%7Cvisibility:on&style=feature:poi.sports_complex%7Celement:geometry%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.sports_complex%7Celement:geometry.fill%7Ccolor:0xbae4b9%7Cvisibility:on&style=feature:poi.sports_complex%7Celement:geometry.stroke%7Ccolor:0xbae4b9&style=feature:road%7Celement:geometry.fill%7Ccolor:0xfefefe%7Cvisibility:on&style=feature:road%7Celement:geometry.stroke%7Ccolor:0xffffff%7Cvisibility:on&style=feature:road.arterial%7Celement:labels%7Cvisibility:off&style=feature:road.highway%7Celement:labels%7Cvisibility:off&style=feature:road.local%7Cvisibility:off&style=feature:transit.line%7Celement:geometry.fill%7Cvisibility:off&style=feature:transit.line%7Celement:geometry.stroke%7Cvisibility:off&style=feature:transit.station%7Celement:geometry%7Ccolor:0xedf0f3%7Cvisibility:on&style=feature:water%7Celement:geometry%7Ccolor:0x9bd0fe%7Cvisibility:on&style=feature:water%7Celement:geometry.fill%7Ccolor:0x9bd0fe%7Cvisibility:on&style=feature:water%7Celement:geometry.stroke%7Ccolor:0x9bd0fe%7Cvisibility:on&size=400x400`
    img.crossOrigin = "Anonymous";
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext("2d");
    img.onload = function() {
        context.drawImage(img, 0, 0,img.width,img.height);
        var imgDataa = context.getImageData(0, 0, mapDimension, mapDimension);
        for (let i = 0; i < imgDataa.data.length; i += 4) {
            pixelArr[Math.floor(Math.floor(i/4)/mapDimension)][Math.floor(Math.floor(i/4)%mapDimension)]=new Point(imgDataa.data[i],imgDataa.data[i + 1],imgDataa.data[i + 2]);
        };
        for (let i = 0; i < pixelArr.length; i+=10) {
            for (let j = 0; j < pixelArr[0].length; j+=10) {
                trimedPixelArr[Math.floor(i/10)][Math.floor(j/10)] = findPixelAppearMost(pixelArr,i,j)
            };
        };
        for(let i = 0;i<trimedPixelArr.length;i++){
            for (let j = 0; j < trimedPixelArr[0].length; j++) {
                gameMap[i][j] = findColorClose(trimedPixelArr[i][j]);
            };
        };
    };


    return gameMap;


    function findPixelAppearMost(arr,i,j){
      let count = {};
      
      for(let x = 0;x<10;x++){
        for(let y = 0;y<10;y++){
          let key = JSON.stringify(arr[i+x][j+y]);
          if(count[key]===undefined){
            count[key] = 1;
          }else{
            count[key] = count[key] + 1;
          }
        }
      }
      var sortable = [];
      for (var pointWithTime in count) {
        sortable.push([pointWithTime, count[pointWithTime]]);
      }
      sortable.sort(function(a, b) {
        return b[1] - a[1];
      });

      return JSON.parse(sortable[0][0]);
    };

    function findColorClose(p){
      let tileType = 0;
      let min = Number.MAX_VALUE;
      let dist = 0;
      if(colorDict[JSON.stringify(p)]!==undefined){
        return colorDict[JSON.stringify(p)];
      }else{
        for(let temp in colorDict){
          let t = JSON.parse(temp);
          dist = getDistance(p,t);
          if(dist<threshold&&dist<min){
            tileType = colorDict[temp];
            min = dist;
          }
        }
      }
      return tileType;
    };

    function getDistance(p,t){
      let dist = 0;
      dist += Math.pow(p.r-t.r,2);
      dist += Math.pow(p.g-t.g,2);
      dist += Math.pow(p.b-t.b,2);
      return Math.sqrt(dist);
    };




};

window.startGame = startGame;

const delay = ms => new Promise(res => setTimeout(res, ms));



// function encode(s) {
//     var out = [];
//     for (var i = 0; i < s.length; i++) {
//         out[i] = s.charCodeAt(i);
//     }
//     return new Uint8Array(out);
// };

// function downloadCurrentDocument(ehhhe, fileName) {
//     var data = encode(JSON.stringify(ehhhe, null, 4));
//     var blob = new Blob([data], {
//         type: 'application/octet-stream'
//     });

//     var url = URL.createObjectURL(blob);
//     var link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', fileName + '.json');
//     var event = document.createEvent('MouseEvents');
//     event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
//     link.dispatchEvent(event);

// };

/*

function borderPosition(row, column, elevation, size = 50) {

    var [x, z] = calculatePosition(row, column);
    var leftTop, rightBottom, rightTop, leftBottom;

    leftTop = [x - size, elevation, z + size];
    rightBottom = [x + size, elevation, z - size];
    rightTop = [x - size, elevation, z - size];
    leftBottom = [x + size, elevation, z + size];

    return [].concat(leftTop, leftBottom, rightBottom, rightTop);

};



function updateBorderHeight(row, column, elevation, totalRow = 100, totalColumn = 100) {

    var index;

    index = (row * totalColumn + column) * 12;

    for (var i = 0; i < 4; i++) {
        borderSegments.geometry.attributes.position.array[index + 1 + i * 3] = elevation;
    }
    borderSegments.geometry.attributes.position.needsUpdate = true;
};


function updateBorderColor(row, column, newColor, totalRow = numberOfRows, totalColumn = numberOfColumns) {

    var index;

    index = (row * totalColumn + column) * 12;

    for (var i = 0; i < 4; i++) {
        borderSegments.geometry.attributes.color.array[index + i * 3] = newColor[0];
        borderSegments.geometry.attributes.color.array[index + 1 + i * 3] = newColor[1];
        borderSegments.geometry.attributes.color.array[index + 2 + i * 3] = newColor[2];
    };

    borderSegments.geometry.attributes.color.needsUpdate = true;
};
*/
/*

function createBorders(totalRow, totalColumn, size) {

    var positions = [];
    var colors = [];

    for (var row = 0; row < totalRow; row++) {
        for (var column = 0; column < totalColumn; column++) {
            positions.push(borderPosition(row, column, groundTiles[row][column].elevation, size));
            colors.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        };
    };

    var indicies = [];

    for (var i = 0; i < totalColumn * totalRow * 4 + 1; i += 4) {
        indicies.push(i, i + 1);
        indicies.push(i + 1, i + 2);
        indicies.push(i + 2, i + 3);
        indicies.push(i + 3, i);
    };

    var bufferGeom = new THREE.BufferGeometry();
    var positionss = new THREE.Float32BufferAttribute(positions.flat(1), 3);
    bufferGeom.setAttribute("position", positionss);
    bufferGeom.setAttribute("color", new THREE.Float32BufferAttribute(colors.flat(1), 3));
    bufferGeom.setIndex(indicies);

    var lsMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
    lsMaterial.linewidth = 4;
    borderSegments = new THREE.LineSegments(bufferGeom, lsMaterial);
    borderSegments.name = "borderSegments";

    scene.add(borderSegments);

};
*/