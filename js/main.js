import { createTiles } from "./createWorldData_v1.js";
import { createMeshes } from "./loadModels.js";
import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import { GUI } from './../libs/three.js-dev/examples/jsm/libs/dat.gui.module.js';
import Stats from './../libs/three.js-dev/examples/jsm/libs/stats.module.js';
import CameraControls from "./../libs/camera-controls/dist/camera-controls.module.js"
import * as holdEvent from "./../libs/camera-controls/dist/hold-event.module.js";

function main() {

    var camera, scene, renderer, stats, gui, spotLight;
    var container = document.getElementById("webgl-output");
    var cameraControls;
    const clock = new THREE.Clock();

    var groundTiles, surfaceTiles, pos_of_objects, floodTiles, countMap, floodData;
    var minElevation, maxElevation;

    var meshDict, meshDictIndex, floodMesh;
    var borderSegments;

    var frame1, frame2;

    var obj;
    var totalAvailableMoney = 50000;
    var expenses = 0;

    var tileSize = 100;
    var numberOfTiles = 5625;
    var numberOfTiles_X = Math.pow(numberOfTiles, 0.5)
    var side_length = numberOfTiles_X * tileSize;
    var numberOfRows = 140;
    var numberOfColumns = 55;

    var transform = new THREE.Object3D();
    var instanceMatrix = new THREE.Matrix4();
    var matrix = new THREE.Matrix4();
    var vector3Scale = new THREE.Vector3(1, 1, 1);
    var vector3Position = new THREE.Vector3(1, 1, 1);

    var dest_vector3Scale = new THREE.Vector3(1, 1, 1);
    var dest_vector3Position = new THREE.Vector3(1, 1, 1);
    var dest_instanceMatrix = new THREE.Matrix4();

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(1, 1);
    var wireframe_1, wireframe_2, wireframe_3, wireframe_4;


    var v1 = new THREE.Vector3(-2700, 0, -3250);
    var v2 = new THREE.Vector3(2600, 0, 3400);
    var bb = new THREE.Box3(v1, v2);


    var tileElevation; //??

    var tileFolder, buildingFolder, tileActions, buildingActions;
    var mitigationFolder;

    var zoom = 2;


    var isFlood = false;
    var doFlood = false;
    var ratioOfFlood = 0.0;
    var maxFloodActionStep = 100;
    var finishGame = 0;
    var elevationhelper = {
        "row": 0,
        "column": 0,
        "elevation": 0
    };

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

    var emptyOptionsCheckbox = document.querySelectorAll("#emptyOptions [type='checkbox']");
    var emptyOptionsSelect = document.querySelectorAll("#emptyOptions select");
    var nonEmptyOptionsSelect = document.querySelectorAll("#nonEmptyOptions select");
    var costValuesEmpty = document.querySelectorAll("#emptyOptions ul li span");
    var costValuesNonEmpty = document.querySelectorAll("#nonEmptyOptions ul li span");
    var allCheckbox = document.querySelectorAll("[type='checkbox']");
    
    [groundTiles, surfaceTiles, floodTiles, pos_of_objects, countMap, floodData, minElevation, maxElevation] = createTiles();
    console.log("groundTiles and surfaceTiles objects are created!!!");
    [meshDict, meshDictIndex] = createMeshes(countMap);
    console.log("meshDict is created!!!");
    console.log(countMap);

    init();
    onWindowResize();
    animate();

    console.log("Scene polycount:", renderer.info.render.triangles);
    console.log("Active Drawcalls:", renderer.info.render.calls);
    console.log("Textures in Memory", renderer.info.memory.textures);
    console.log("Geometries in Memory", renderer.info.memory.geometries);

    function init() {

        CameraControls.install({ THREE: THREE });

        //Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xcce0ff);

        // Camera set up
        var frustumSize = 1000;
        var a = $(container).width();
        var b = $(container).height()
        var aspect = a / b;
        camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 10000);
        camera.position.set(0 * a, a, -2 * a);
        camera.lookAt(scene.position);
        scene.add(camera);

        // Lights
        var light = new THREE.AmbientLight(0xFFFFFF, 0.8);
        scene.add(light);

        spotLight = new THREE.SpotLight(0xffffff, 2);
        spotLight.position.set(8000, 1000, 5000);
        spotLight.castShadow = true;
        spotLight.receiveShadow = true;
        spotLight.distance = 10000
        spotLight.angle = Math.PI / 4
        //scene.add(spotLight);

        // renderer

        renderer = new THREE.WebGLRenderer({ container });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize($(container).width(), $(container).height());
        renderer.shadowMap.enabled = false;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        renderer.shadowMap.autoUpdate = false;

        container.appendChild(renderer.domElement);

        createWorld();
        createWireframes();

        cameraControls = new CameraControls(camera, renderer.domElement);
        cameraControls.setBoundary(bb);
        cameraControls.mouseButtons.left = CameraControls.ACTION.TRUCK;
        cameraControls.mouseButtons.right = CameraControls.ACTION["NONE"];
        cameraControls.mouseButtons.wheel = CameraControls.ACTION["NONE"];
        //cameraControls.verticalDragToForward = false;
        //cameraControls.truckSpeed = 8.0;
        cameraControls.zoom(-0.25, false);

        //stats = new Stats();
        //document.body.appendChild( stats.domElement );

        gui = new GUI();
        createMitigationGUI();
        createControlGUI();
        emptyTileGUI();
        buildingGUI();
        cameraMovement();
        //visibilityOfDamagePanel();
        //visibilityOfRightMenu();
        createBorders(140, 55, 50);
        guiInstalliation();
        mitigationPanelNonEmpty();
        mitigationPanelEmpty();
        guiButtonSetUp();
        updateSelectCostValue();
        quickSummaryPanelUpdate();
        enableAllCheckBox(false);
        //guiCostUpdate();
        //countdown( "countdown", 1000, 0 );
        //updateBudgetPanel();
        //createBorderWireframe(50);

        renderer.domElement.addEventListener('mousemove', onMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onMouseClick, false);
        renderer.shadowMap.needsUpdate = true;

    };


    function createWorld() {

        var x, z;

        for (var row = 0; row < 140; row++) {
            for (var column = 0; column < 55; column++) {

                obj = groundTiles[row][column];

                transform.scale.set(tileSize, obj.elevation, tileSize);

                [x, z] = calculatePosition(row, column);

                transform.position.set(
                    x,
                    obj.elevation / 2,
                    z);
                transform.updateMatrix();

                meshDict[obj.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
                groundTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                //meshDict[obj.type].renderOrder = 0;
            };
        };


        transform.scale.set(1, 1, 1);

        for (let i of pos_of_objects) {

            [row, column] = [i[0], i[1]];
            obj = surfaceTiles[row][column];
            if (row < numberOfRows && column < numberOfColumns) {

                [x, z] = calculatePosition(obj.row, obj.column);

                transform.position.set(
                    x,
                    obj.elevation,
                    z);
                transform.updateMatrix();

                meshDict[obj.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
                surfaceTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                //meshDict[obj.type].renderOrder = 0;
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
            if (name != "f1") {
                scene.add(meshDict[name]);
            };
        };



    };


    function addFloodScene() {
        scene.add(meshDict["f1"]);
    };

    function createWireframes() {

        var helpGeo = new THREE.BoxBufferGeometry(98, 98);
        helpGeo.rotateX(-Math.PI * 0.5)
        helpGeo.rotateY(-45 * THREE.Math.DEG2RAD);

        var wireframegeo = new THREE.EdgesGeometry(helpGeo);
        var wireframemat = new THREE.LineBasicMaterial({ color: "#000000", linewidth: 4 });
        wireframe_1 = new THREE.LineSegments(wireframegeo, wireframemat);
        wireframe_1.name = "wireframe_1";
        wireframe_1.visible = false;
        wireframe_1.transparent = true;
        scene.add(wireframe_1);

        var wireframemat_2 = new THREE.LineBasicMaterial({ color: "#cc0000", linewidth: 4 });
        wireframe_2 = new THREE.LineSegments(wireframegeo, wireframemat_2);
        wireframe_2.name = "wireframe_2";
        wireframe_2.visible = false;
        //wireframe_2.renderOrder = 10;
        scene.add(wireframe_2);

        var wireframemat_3 = new THREE.LineBasicMaterial({ color: "#800080", linewidth: 4 });
        wireframe_3 = new THREE.LineSegments(wireframegeo, wireframemat_3);
        wireframe_3.name = "wireframe_3";
        wireframe_3.visible = false;
        //wireframe_2.renderOrder = 10;
        scene.add(wireframe_3);

        //var wireframemat_3 = new THREE.LineBasicMaterial( { color: "#800080", linewidth: 4 } );
        wireframe_4 = new THREE.LineSegments(wireframegeo, wireframemat_3);
        wireframe_4.name = "wireframe_4";
        wireframe_4.visible = false;
        //wireframe_2.renderOrder = 10;
        scene.add(wireframe_4);


    };





    function createControlGUI() {

        var gameControl = new function() {

            this.rotate = function() {

                cameraControls.rotate(-90 * THREE.Math.DEG2RAD, 0, true);

            };

            this.zoomIn = function() {

                zoom /= 2;

                if (zoom == 1) {

                    var v1 = new THREE.Vector3(-3000, 0, -3600);
                    var v2 = new THREE.Vector3(2900, 0, 3800);
                    bb = new THREE.Box3(v1, v2);

                    cameraControls.setBoundary(bb);
                    cameraControls.zoom(0.25, true);

                } else if (zoom == 2) {

                    var v1 = new THREE.Vector3(-2700, 0, -3250);
                    var v2 = new THREE.Vector3(2600, 0, 3400);
                    bb = new THREE.Box3(v1, v2);

                    cameraControls.setBoundary(bb);
                    cameraControls.zoom(0.25, true);
                } else if (zoom == 4) {

                    var v1 = new THREE.Vector3(-2100, 0, -2500);
                    var v2 = new THREE.Vector3(2000, 0, 2650);
                    bb = new THREE.Box3(v1, v2);

                    cameraControls.setBoundary(bb);
                    cameraControls.zoom(0.1, true);

                }
                /*
                else if (zoom == 8){

                	var v1 = new THREE.Vector3(-3200, 0, -400);
                	var v2 = new THREE.Vector3( 3200, 0, 400);
                	bb = new THREE.Box3(v1, v2);

                	//cameraControls.setBoundary(bb);
                	cameraControls.zoom(0.15, true);

                }
                */
                else {

                    zoom *= 2;

                };

            };

            this.zoomOut = function() {

                zoom *= 2;

                if (zoom == 2) {

                    var v1 = new THREE.Vector3(-2700, 0, -3250);
                    var v2 = new THREE.Vector3(2600, 0, 3400);
                    bb = new THREE.Box3(v1, v2);

                    cameraControls.setBoundary(bb);
                    cameraControls.zoom(-0.25, true);

                } else if (zoom == 4) {

                    var v1 = new THREE.Vector3(-2100, 0, -2500);
                    var v2 = new THREE.Vector3(2000, 0, 2650);
                    bb = new THREE.Box3(v1, v2);

                    cameraControls.setBoundary(bb);
                    cameraControls.zoom(-0.25, true);

                } else if (zoom == 8) {

                    var v1 = new THREE.Vector3(-1700, 0, -1950);
                    var v2 = new THREE.Vector3(1600, 0, 2050);
                    bb = new THREE.Box3(v1, v2);

                    cameraControls.setBoundary(bb);
                    cameraControls.zoom(-0.1, true);
                }
                /*
                else if (zoom == 16){

                	v1 = new THREE.Vector3(-5150, 0, -1200);
                	v2 = new THREE.Vector3( 4875, 0, 1150);
                	bb = new THREE.Box3(v1, v2);

                	//cameraControls.setBoundary(bb);
                	cameraControls.zoom(-0.15, true);
                }
                */
                else {
                    zoom /= 2;
                };

            };

            this.flood = function() {

                doFlood = !doFlood;
                updateFloodInformation();
                isFlood = true;
                addFloodScene();
                visibilityOfDamagePanel(true);
                clearColorOfRiskyRegions();

            };

            this.reset = function() {

                zoom = 2;
                cameraControls.reset();
                isFlood = false;
                clearFlood();
                moveWireFrame_2(2, 0, 0);
                moveWireFrame_3(2, 0, 0);
                visibilityOfDamagePanel();
                //countdown( "countdown", 10, 0 );
                clearColorOfRiskyRegions();
                clearColorOfMitigatedRegions();
            };

            this.saveMap = function() {

                downloadCurrentDocument(groundTiles, "groundTiles");
                downloadCurrentDocument(surfaceTiles, "surfaceTiles");

            };

            this.shadow = function() {

                if (renderer.shadowMap.enabled) {
                    renderer.shadowMap.enabled = !renderer.shadowMap.enabled;
                    renderer.clear(spotLight.shadow.map);
                    renderer.shadowMap.needsUpdate = true;

                    console.log(renderer.shadowMap.enabled);
                } else {
                    renderer.shadowMap.enabled = !renderer.shadowMap.enabled;
                    renderer.shadowMap.needsUpdate = true;
                    console.log(renderer.shadowMap.enabled);
                };

            };

            this.showRiskyAreas = function() {

                //var positions_risky_regions = findRiskyAreas();
                changeColorOfRiskyRegions();

            };

            this.showMitigatedRegions = function() {
                changeColorOfMitigatedRegions();
            }

        };

        gui.add(gameControl, "shadow");
        gui.add(gameControl, "rotate");
        gui.add(gameControl, "zoomIn");
        gui.add(gameControl, "zoomOut");
        gui.add(gameControl, "reset");
        gui.add(gameControl, "flood").name("Flood Action");
        gui.add(gameControl, "showRiskyAreas");
        gui.add(gameControl, "showMitigatedRegions");
        gui.add(gameControl, "saveMap");
    };



    function createMitigationGUI() {

        mitigationFolder = gui.addFolder("Mitigation Options");

        var mitigationActions = new function() {

            this.floodInsurance = false;
            this.dryWaterproofBuilding = false;
            this.wetWaterproofBuilding = false;
            if (selectedTile.isSelected) {
                console.log("aaaa");
                this.floodWall = groundTiles[selectedTile.row][selectedTile.column].floodWall;
            } else {
                console.log("bbbb");
                this.floodWall = 0;
            };

            this.sandbag = 0;
            this.elevateStructure = 0;


            this.applyFloodWall = function() {

                if (selectedTile.isSelected) {

                    groundTiles[selectedTile.row][selectedTile.column].floodWall = Number(mitigationActions.floodWall);
                    expenses += 10;
                    totalAvailableMoney -= 10;
                    updateBudgetPanel();

                };

            };

            this.applyElevatesStructure = function() {

                if (selectedTile.isSelected) {

                    groundTiles[selectedTile.row][selectedTile.column].elevateStructure = Number(mitigationActions.elevateStructure);
                    expenses += 10;
                    totalAvailableMoney -= 10;
                    updateBudgetPanel();
                };
            };


            this.applyFloodInsurance = function() {

                if (selectedTile.isSelected) {

                    groundTiles[selectedTile.row][selectedTile.column].floodInsurance = mitigationActions.floodInsurance;
                    expenses += 10;
                    totalAvailableMoney -= 10;
                    updateBudgetPanel();
                };

                if (selectedBuilding.isSelected) {
                    surfaceTiles[selectedTile.row][selectedTile.column].floodInsurance = mitigationActions.floodInsurance;
                    expenses += 10;
                    totalAvailableMoney -= 10;
                    updateBudgetPanel();
                };
            };


            this.applySandbag = function() {

                if (selectedTile.isSelected) {

                    groundTiles[selectedTile.row][selectedTile.column].sandbag = Number(mitigationActions.sandbag);
                    expenses += 10;
                    totalAvailableMoney -= 10;
                    updateBudgetPanel();

                };
            };


            this.dryWaterproofBuildingg = function() {
                console.log("dryWaterproofBuilding");
            };


            this.wetWaterproofBuildingg = function() {

                console.log("wetWaterproofBuilding");
            };

        };

        mitigationFolder.add(mitigationActions, "floodWall", [0, 3, 5, 10, 50]).name("Flood Wall (ft)").onChange(mitigationActions.applyFloodWall).listen();

        mitigationFolder.add(mitigationActions, "elevateStructure", 0, 30).step(5).name("Elevate Structure").onChange(mitigationActions.applyElevatesStructure).listen();

        mitigationFolder.add(mitigationActions, "floodInsurance", 0).onChange(mitigationActions.applyFloodInsurance).name("Flood Insurance");

        mitigationFolder.add(mitigationActions, "sandbag", [0, 3, 5, 10]).setValue(0).name("Sandbag (ft)").onChange(mitigationActions.applySandbag).listen();

        mitigationFolder.add(mitigationActions, "dryWaterproofBuilding").onChange(mitigationActions.dryWaterproofBuildingg).name("Dry Waterproof Building");
        mitigationFolder.add(mitigationActions, "wetWaterproofBuilding").onChange(mitigationActions.wetWaterproofBuildingg).name("Wet Waterproof Building");

    };


    function buildingGUI() {

        buildingFolder = gui.addFolder("Building Options");

        buildingActions = new function() {

            this.tileElevation = selectedTile.elevation;

            this.removeBuilding = function() {

                deleteBuilding();
                clearSelectedTile();

            };

            this.move = function() {

                selectedBuilding.isMove = true;

            };

            this.changeElevation = function() {
                changeElevation(
                    selectedTile.row,
                    selectedTile.column,
                    buildingActions.tileElevation);
            };
        };

        buildingFolder.add(buildingActions, "removeBuilding").name("Remove Building");
        buildingFolder.add(buildingActions, "move").name("Move Building");
        buildingFolder.add(buildingActions, "tileElevation", 40, 300).onChange(buildingActions.changeElevation).listen().name("Tile Elevation");
        buildingFolder.hide();

    };


    function emptyTileGUI() {

        tileFolder = gui.addFolder("Tile Options");

        tileActions = new function() {

            this.tileElevation = selectedTile.elevation;
            this.addBuilding = "";
            this.type = "";
            this.addBuildingAction = function() {

                createBuilding(
                    tileActions.addBuilding,
                    selectedTile.row,
                    selectedTile.column);
                clearSelectedTile();
                tileActions.addBuilding = "";
            };

            this.changeType = function() {

                changeTileType(
                    tileActions.type,
                    selectedTile.row,
                    selectedTile.column
                );
                clearSelectedTile();
                tileActions.type = "";

            };

            this.changeElevation = function() {
                changeElevation(
                    selectedTile.row,
                    selectedTile.column,
                    tileActions.tileElevation);

            };
        };

        tileFolder.add(tileActions, "addBuilding", ["b1", "b2", "b3", "s1"]).onChange(tileActions.addBuildingAction).listen().name("Building Construct");
        tileFolder.add(tileActions, "type", ["w1", "c1", "g1", "road1", "road2", "y1", "r1"]).onChange(tileActions.changeType).listen().name("Change Tile Type");
        tileFolder.add(tileActions, "tileElevation", 40, 300).onChange(tileActions.changeElevation).listen().name("Tile Elevation");
        tileFolder.hide();

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

    };

    function updateBudgetPanel() {

        document.getElementById("mainBudgetTable").rows[1].cells[1].innerHTML = " $" + (expenses).toFixed(0);
        document.getElementById("mainBudgetTable").rows[2].cells[1].innerHTML = " $" + (totalAvailableMoney).toFixed(0);

    };

    function updateFloodInformation() {

        var tempFloodLevel;
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {

                obj = floodTiles[row][column];
                if (obj != 0) {

                    tempFloodLevel = minMax(75) + 5 - groundTiles[row][column].elevation - Math.max(
      
                        groundTiles[row][column].sandbag,
                        groundTiles[row][column].floodWall) - groundTiles[row][column].elevateStructure;
                    floodTiles[row][column].height = tempFloodLevel;
                }
            }
        }


    }

    function findNumberofRiskyAreas(){
    	var tempFloodLevel;
    	var numberOfRiskyAreas = 0;
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {

                obj = floodTiles[row][column];
                if (obj != 0) {

                    tempFloodLevel = minMax(75) + 5 - groundTiles[row][column].elevation - Math.max(
                        groundTiles[row][column].sandbag,
                        groundTiles[row][column].floodWall) - groundTiles[row][column].elevateStructure;
                    floodTiles[row][column].height = tempFloodLevel;
                    if (tempFloodLevel > 0){numberOfRiskyAreas += 1;}
                }
            }
        }
        return numberOfRiskyAreas;	
    }

    function updateDamagePanel() {

        var [total, totalBuilding] = findNumberOfEffectedBuilding();
        var [totalAreaDamage, totalBuildingDamage] = calculateTotalDamage();

        document.getElementById("totalArea").innerHTML = total + " sq mil";
        document.getElementById("effected_building").innerHTML = totalBuilding + " units";
        document.getElementById("areaDamages").innerHTML = (totalAreaDamage / 1000).toFixed(1) + "K $";
        document.getElementById("buildingDamages").innerHTML = (totalBuildingDamage / 1000).toFixed(1) + "K $";

    };


    function visibilityOfDamagePanel(visible = false) {
        //updateDamagePanel();
        if (visible) { document.getElementById("damage_panel").style.visibility = "visible"; } else { document.getElementById("damage_panel").style.visibility = "hidden"; };
    };


    function visibilityOfRightMenu(visible = false) {
        if (visible) { document.getElementById("rightMenu").style.visibility = "visible"; } else { document.getElementById("rightMenu").style.visibility = "hidden"; };
    };

    function updateRightMenu(row, column, event) {
        document.getElementById("rightMenu").style.left = event.pageX + "px";
        document.getElementById("rightMenu").style.top = event.pageY + "px";
        document.getElementById("row").innerHTML = "Row:" + row;
        document.getElementById("column").innerHTML = "Column:" + column;

        document.getElementById("sandbag").innerHTML = "Sandbag (ft): " + groundTiles[row][column].sandbag;
        document.getElementById("floodWall").innerHTML = "Flood Wall (ft): " + groundTiles[row][column].floodWall;
        document.getElementById("floodInsurance").innerHTML = "Flood Insurance: " + groundTiles[row][column].floodInsurance;
        document.getElementById("elevateStructure").innerHTML = "Elevate Structure (ft): " + (groundTiles[row][column].elevateStructure).toFixed(0);
    };



    function guiInstalliation() {

        // Show Risky Areas 
        $("#showRiskyAreaBtn").on("click", function() {

            changeColorOfRiskyRegions();
        });

        // Show Mitigated Areas
        $("#showMitigatedAreaBtn").on("click", function() {

            changeColorOfMitigatedRegions();
        });
        // Start
        $("#startBtn").on("click", function() {

            doFlood = !doFlood;
            updateFloodInformation();
            isFlood = true;
            addFloodScene();
            //visibilityOfDamagePanel(true);
            clearColorOfRiskyRegions();
        });
        /*
        //Empty-Tile
        //Add Building
        $("#addStructureBtn").on("click", function () {
            createBuilding(
        		document.getElementById("addStructureValue").value,
        		selectedTile.row,
        		selectedTile.column);
        	clearSelectedTile();

        	expenses += addStructureCost(document.getElementById("addStructureValue").value);
        	totalAvailableMoney -= addStructureCost(document.getElementById("addStructureValue").value);
        	updateBudgetPanel();
        	//showTilePanels(0, 0);
        	//showTilePanels(0, 1);
        });
        //Change Tile
        $("#changeTileBtn").on("click", function () {
        	changeTileType(
        		document.getElementById("changeTileValue").value,
        		selectedTile.row,
        		selectedTile.column
        	);
        	clearSelectedTile();
        	expenses += 100;
        	totalAvailableMoney -= 100;
        	updateBudgetPanel();
        });
        //apply FloodWall
        $("#floodWallBtn_E").on("click", function(){

        	groundTiles[selectedTile.row][selectedTile.column].floodWall = Number(document.getElementById("floodWallValue_E").value);
        	expenses += addFloodWallCost(document.getElementById("floodWallValue_E").value);
        	totalAvailableMoney -= addFloodWallCost(document.getElementById("floodWallValue_E").value);
        	updateBudgetPanel();
        });
        //apply SandBag
        $("#sandBagBtn_E").on("click", function(){

        	groundTiles[selectedTile.row][selectedTile.column].sandbag = Number(document.getElementById("sandBagValue_E").value);
        	expenses += addSandBagCost(document.getElementById("sandBagValue_E").value);
        	totalAvailableMoney -= addSandBagCost(document.getElementById("sandBagValue_E").value);
        	updateBudgetPanel();

        });
        //apply Insurance
        $("#insuranceBtn_E").on("click", function(){

        	groundTiles[selectedTile.row][selectedTile.column].floodInsurance = true;
        	expenses += 300;
        	totalAvailableMoney -= 300;
        	updateBudgetPanel();
        });

        //Non-Empty Tiles

        //Remove Building
        $("#removeStructureBtn_N").on("click", function () {
        	deleteBuilding();
        	clearSelectedTile();
        	expenses += 400;
        	totalAvailableMoney -= 400;
        	updateBudgetPanel();
        });

        //Relocate building
        $("#relocateStructureBtn_N").on("click", function () {
        	selectedBuilding.isMove = true;
        });

        //Elevate building
        $("#elevateStructureBtn_N").on("click", function () {
        	groundTiles[selectedTile.row][selectedTile.column].elevateStructure = Number(document.getElementById("elevateStructureValue_N").value);
        	expenses += Number(document.getElementById("elevateStructureValue_N").value) * 100;
        	totalAvailableMoney -= Number(document.getElementById("elevateStructureValue_N").value) * 100;
        	updateBudgetPanel();
        });
        //apply FloodWall
        $("#floodWallBtn_N").on("click", function(){

        	groundTiles[selectedTile.row][selectedTile.column].floodWall = Number(document.getElementById("floodWallValue_N").value);
        	expenses += addFloodWallCost(document.getElementById("floodWallValue_N").value);
        	totalAvailableMoney -= addFloodWallCost(document.getElementById("floodWallValue_N").value);
        	updateBudgetPanel();
        });
        //apply SandBag
        $("#sandBagBtn_N").on("click", function(){

        	groundTiles[selectedTile.row][selectedTile.column].sandbag = Number(document.getElementById("sandBagValue_N").value);
        	expenses += addSandBagCost(document.getElementById("sandBagValue_N").value);
        	totalAvailableMoney -= addSandBagCost(document.getElementById("sandBagValue_N").value);
        	updateBudgetPanel();

        });
        //apply Insurance
        $("#floodWallBtn_N").on("click", function(){

        	groundTiles[selectedTile.row][selectedTile.column].floodInsurance = true;
        	expenses += 400;
        	totalAvailableMoney -= 400;
        	surfaceTiles[selectedTile.row][selectedTile.column].floodInsurance = true;
        	expenses += 400;
        	totalAvailableMoney -= 400;
        	updateBudgetPanel();
        	//updateBudgetPanel();
        });
        */


    };


    function guiCostUpdate() {

        //Empty Tile Panel
        //Add Structure Cost Update
        $("#addStructureValue").on("click", function() {
            document.getElementById("emptyMitigationTable").rows[0].cells[2].innerHTML = "$" + addStructureCost(document.getElementById("addStructureValue").value);
        });
        //Add Flood Wall Cost Update
        $("#floodWallValue_E").on("click", function() {
            document.getElementById("emptyMitigationTable").rows[2].cells[2].innerHTML = "$" + addFloodWallCost(document.getElementById("floodWallValue_E").value);
        });
        //Add SandBag Cost Update
        $("#sandBagValue_E").on("click", function() {
            document.getElementById("emptyMitigationTable").rows[3].cells[2].innerHTML = "$" + addSandBagCost(document.getElementById("sandBagValue_E").value);
        });

        //Non-Empty Tile Panel


        //Add Flood Wall Cost Update
        $("#floodWallValue_N").on("click", function() {
            document.getElementById("nonEmptyMitigationTable").rows[0].cells[2].innerHTML = "$" + addFloodWallCost(document.getElementById("floodWallValue_N").value);
        });
        //Add SandBag Cost Update
        $("#sandBagValue_N").on("click", function() {
            document.getElementById("nonEmptyMitigationTable").rows[1].cells[2].innerHTML = "$" + addSandBagCost(document.getElementById("sandBagValue_N").value);
        });
        //Add Structure Cost Update
        $("#elevateStructureValue_N").on("click", function() {
            document.getElementById("nonEmptyMitigationTable").rows[3].cells[2].innerHTML = "$" + Number(document.getElementById("elevateStructureValue_N").value) * 100;
        });
    }


    function calculateTotalDamage() {

        var totalBuildingDamage = 0
        var totalAreaDamage = 0;

        for (var row = 0; row < 100; row++) {
            for (var column = 0; column < 50; column++) {
                obj = floodTiles[row][column];
                if (obj != 0) {
                    totalAreaDamage += areaDamage(obj.height, groundTiles[row][column].type, groundTiles[row][column].floodInsurance)
                    if (surfaceTiles[row][column] != 0) {
                        totalBuildingDamage += buildingDamage(obj.height, row, column);
                    };
                };
            };
        };

        return [totalAreaDamage, totalBuildingDamage];

    };

    function areaDamage(height, type, insurance) {

        if (insurance == true) {
            return 0
        } else if (type == "w1") {
            return 0;
        } else if (type == "g1") {
            return height * 10
        } else if (type == "c1") {
            return height * 5
        } else {
            return height
        };
    };

    function buildingDamage(height, row, column) {

        if (surfaceTiles[row][column].floodInsurance == true) {
            return 0;
        }
        return height * 20;
    };

    function floodAction() {


        var currentHeight, x, z;

        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {

                obj = floodTiles[row][column];
                if (obj != 0) {
                    currentHeight = obj.height * ratioOfFlood / maxFloodActionStep;

                    transform.scale.set(
                        tileSize, currentHeight, tileSize);

                    [x, z] = calculatePosition(row, column);

                    transform.position.set(
                        x,
                        groundTiles[row][column].elevation + currentHeight / 2,
                        z);
                    transform.updateMatrix();

                    meshDict[obj.type].setMatrixAt(obj.instanceId, transform.matrix);

                    updateBorderHeight(row, column, groundTiles[row][column].elevation + currentHeight, 140, 55);
                };

            };
        };

        meshDict["f1"].instanceMatrix.needsUpdate = true;
        ratioOfFlood++;


        if (ratioOfFlood == maxFloodActionStep + 1) {

            doFlood = false;
            ratioOfFlood = 0;

        };
        //console.log(calculateTotalDamage());
        //console.log(calculateInsurancedMoney());
        //console.log(findNumberofEffectedPeople());
        //console.log(findNumberOfEffectedBuilding());
    };


    function findNumberOfEffectedBuilding() {

        var totalBuilding = 0;
        var total = 0;
        updateFloodInformation();
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {

                obj = floodTiles[row][column];
                if (obj != 0) {

                    if (obj.height > 0) {
                        total++;
                        if (surfaceTiles[row][column] != 0)
                            totalBuilding++;
                    };
                };
            };
        };

        return [total, totalBuilding];
    }

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
                    updateBorderHeight(row, column, groundTiles[row][column].elevation, 140, 55);
                }

            };
        };

        meshDict["f1"].instanceMatrix.needsUpdate = true;
        scene.remove(meshDict["f1"]);
    };


    function animate() {

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        const updated = cameraControls.update(delta);

        requestAnimationFrame(animate);

        if (doFlood) {

            floodAction();
        };

        render();
        //stats.update();

    };


    function render() {

        renderer.render(scene, camera);

    };


    function onMouseMove(event) {

        event.preventDefault();
        const { top, left, width, height } = renderer.domElement.getBoundingClientRect();

        mouse.x = ((event.clientX - left) / width) * 2 - 1;
        mouse.y = -((event.clientY - top) / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        var intersection = raycaster.intersectObjects(scene.children);

        if (intersection.length > 0) {
            if (!isWireFrame(intersection[0].object.name)) {

                var meshName = intersection[0].object.name;
                var instanceId = intersection[0].instanceId;

                var [row, column, size] = findPosition(instanceId, meshName);
                var [pos_x, pos_z] = calculatePosition(row, column);

                //updateFrame(row, column, groundTiles[row][column].elevation + 50, 50);
                if (hasMitigation(row, column)) {
                    wireframe_4.position.set(pos_x, findElevation(row, column) + 4, pos_z);
                    wireframe_4.visible = true;
                    wireframe_4.updateMatrix();
                    wireframe_1.visible = false;
                    //wireframe_1.updateMatrix();

                } else {
                    wireframe_1.position.set(pos_x, findElevation(row, column) + 4, pos_z);
                    wireframe_1.visible = true;
                    wireframe_1.updateMatrix();
                    wireframe_4.visible = false;
                }

            }


        };


    };


    function isWireFrame(name) {

        if (name == "wireframe_1" || name == "wireframe_2" || name == "borderSegments" || name == "wireframe_3" || name == "wireframe_4") {
            return true;
        };

        return false;
    };


    function enableAllCheckBox(enable){
    	if (enable){

    		for (var i = 0; i < allCheckbox.length; i++){
    			allCheckbox[i].disabled = false;
    		}

    	}
    	else{
    		for (var i = 0; i < allCheckbox.length; i++){
    			allCheckbox[i].disabled = true;
    		}    		
    	}

    }

    function onMouseClick(event) {

        //visibilityOfRightMenu(false);

        event.preventDefault();
        const { top, left, width, height } = renderer.domElement.getBoundingClientRect();

        mouse.x = ((event.clientX - left) / width) * 2 - 1;
        mouse.y = -((event.clientY - top) / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        var intersection = raycaster.intersectObjects(scene.children);
        switch (event.button) {
            case 0: //left
                if (intersection.length > 0) {
                    if (!isWireFrame(intersection[0].object.name)) {

                        var meshName = intersection[0].object.name;
                        var instanceId = intersection[0].instanceId;


                        var [row, column, size] = findPosition(instanceId, meshName);
                        wireframe_1.visible = false;
                        //wireframe_1.updateMatrix();

                        wireframe_4.visible = false;
                        //wireframe_1.updateMatrix();

                        if (!selectedTile.isSelected) {
                        	enableAllCheckBox(true);
                            fillSelectedTile(row, column, event);

                        } else {

                            if (selectedTile.row == row && selectedTile.column == column) {
                            	enableAllCheckBox(false);
                                clearSelectedTile();

                            } else if (selectedBuilding.isMove) {

                                changePositionBuilding(row, column);

                            } else {

                                clearSelectedTile();
                                enableAllCheckBox(true);
                                fillSelectedTile(row, column, event);

                            };
                        };
                    };
                };
                break;
            case 2: // right
                if (intersection.length > 0) {
                    if (!isWireFrame(intersection[0].object.name)) {
                        var meshName = intersection[0].object.name;
                        var instanceId = intersection[0].instanceId;
                        var [row, column, size] = findPosition(instanceId, meshName);
                        if (selectedTile.row == row && selectedTile.column == column) {
                            updateRightMenu(row, column, event);
                            //visibilityOfRightMenu(true);
                        };
                    };
                };
        };
    };


    function calculatePosition(row, column, tileSize = 100, offset_x = 3900, offset_z = 5000) {

        var m, n, pos_x, pos_z;

        m = row % 2;
        n = Math.floor(row / 2);

        pos_z = n * tileSize * Math.sqrt(2) + m * tileSize * Math.sqrt(2) * 0.5 - offset_z;
        pos_x = column * tileSize * Math.sqrt(2) + m * tileSize * Math.sqrt(2) * 0.5 - offset_x;

        return [pos_x, pos_z];

    };



    function calculateArrayPosition(pos_x, pos_z, tileSize = 100, offset_x = 3900, offset_z = 5000) {

        var m, n, row, column, pos_xx, pos_zz;

        pos_xx = pos_x + offset_x;
        pos_zz = pos_z + offset_z;
        pos_xx /= tileSize;
        pos_zz /= tileSize;

        pos_xx /= Math.sqrt(2);
        pos_zz /= Math.sqrt(2);

        if ((2 * pos_xx - 1) % 2 == 0) { m = 1; } else { m = 0; };

        column = pos_xx - m / 2;
        n = pos_zz - m / 2;
        row = Math.ceil(n * 2) + m;

        row = Math.ceil(row);
        column = Math.ceil(column);

        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                [pos_xx, pos_zz] = calculatePosition(row - i, column - j);
                if (Math.round(pos_xx) == Math.round(pos_x) && Math.round(pos_zz) == Math.round(pos_z)) {
                    return [row - i, column - j];
                };
            };
        };

        return [row, column];

    };


    function findPosition(instanceId, meshName) {

        var instanceMatrix_ = new THREE.Matrix4();
        var vector3Scale_ = new THREE.Vector3(1, 1, 1);
        var vector3Position_ = new THREE.Vector3(1, 1, 1);
        var row, column, size;

        meshDict[meshName].getMatrixAt(instanceId, instanceMatrix_);
        vector3Position_.setFromMatrixPosition(instanceMatrix_);
        vector3Scale_.setFromMatrixScale(instanceMatrix_);

        [row, column] = calculateArrayPosition(vector3Position_.x, vector3Position_.z);
        size = findSize(vector3Scale_.x);

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

    function getRandomArbitrary(min = 10, max = 120) {

        return Math.random() * (max - min) + min;

    };

    function fillSelectedTile(row, column, event) {

        selectedTile.isSelected = true;
        selectedTile.instanceId = groundTiles[row][column].instanceId;
        selectedTile.meshName = groundTiles[row][column].type;
        selectedTile.row = row;
        selectedTile.column = column;
        [selectedTile.pos_x, selectedTile.pos_z] = calculatePosition(
            row, column);
        selectedTile.elevation = groundTiles[row][column].elevation;

        showMitigationOptions(1);
        //showTilePanels(1, 0, event);
        updateEmptyOptions(row, column);
        tileActions.tileElevation = selectedTile.elevation;
        //tileInformationPanelUpdate();
        if (surfaceTiles[row][column]) {
            fillSelectedBuilding(row, column);
            //showTilePanels(0, 1, event);
        };

        if (hasMitigation(row, column)) {
            moveWireFrame_3(1, row, column);
            wireframe_2.visible = false
        } else {
            wireframe_3.visible = false;
            moveWireFrame_2(1, row, column);
        };
        tileInformationPanelUpdate();
    };

    function updateTilePanels(empty, nonempty) {
        //document.getElementById("mainBudgetTable").rows[1].cells[1].innerHTML = " $" + (expenses).toFixed(0);
        if (empty == 1) {
            document.getElementById("emptyTileInformationTableLeft").rows[0].cells[1].innerHTML = groundTiles[selectedTile.row][selectedTile.column].type;
            document.getElementById("emptyTileInformationTableLeft").rows[1].cells[1].innerHTML = selectedTile.elevation;
            if (groundTiles[selectedTile.row][selectedTile.column].floodInsurance) {
                document.getElementById("insuranceBtn_E_check").style.display = "block";
                document.getElementById("insuranceBtn_E").style.display = "none";
            } else {
                document.getElementById("insuranceBtn_E_check").style.display = "none";
                document.getElementById("insuranceBtn_E").style.display = "block";
            }

        };

        if (nonempty == 1) {
            document.getElementById("nonEmptyTileInformationTableLeft").rows[0].cells[1].innerHTML = groundTiles[selectedTile.row][selectedTile.column].type;
            document.getElementById("nonEmptyTileInformationTableLeft").rows[1].cells[1].innerHTML = selectedTile.elevation;
        };

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

        tileFolder.close();
        tileFolder.hide();

        clearSelectedBuilding();
        moveWireFrame_2(2, 0, 0);
        moveWireFrame_3(2, 0, 0);

    };


    function fillSelectedBuilding(row, column) {

        selectedBuilding.isSelected = true;
        selectedBuilding.meshName = surfaceTiles[row][column].type;
        selectedBuilding.instanceId = surfaceTiles[row][column].instanceId;
        selectedBuilding.row = row;
        selectedBuilding.column = column;
        [selectedBuilding.pos_x, selectedBuilding.pos_z] = calculatePosition(
            row, column);
        selectedBuilding.height = surfaceTiles[row][column].height;
        selectedBuilding.size = surfaceTiles[row][column].size;
        selectedBuilding.peopleOnIt = surfaceTiles[row][column].peopleOnIt;

        showMitigationOptions(0);
        updateNonEmptyOptions(row, column);
        buildingActions.tileElevation = selectedTile.elevation;

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

        buildingFolder.hide();
        buildingFolder.close();

    };


    function moveWireFrame_2(type, row, column) {

        var [pos_x, pos_z] = [selectedTile.pos_x, selectedTile.pos_z];
        var floodHeight = 0;

        if (isFlood) {
            floodHeight = floodTiles[row][column].height;
        };

        wireframe_2.position.set(
            selectedTile.pos_x,
            groundTiles[row][column].elevation + floodHeight + 4,
            selectedTile.pos_z);
        if (type == 1) { wireframe_2.visible = true; } else { wireframe_2.visible = false; };

        wireframe_2.updateMatrix();

    };

    function moveWireFrame_3(type, row, column) {

        var [pos_x, pos_z] = [selectedTile.pos_x, selectedTile.pos_z];
        var floodHeight = 0;

        if (isFlood) {
            floodHeight = floodTiles[row][column].height;
        };

        wireframe_3.position.set(
            selectedTile.pos_x,
            groundTiles[row][column].elevation + floodHeight + 4,
            selectedTile.pos_z);
        if (type == 1) { wireframe_3.visible = true; } else { wireframe_3.visible = false; };

        wireframe_3.updateMatrix();

    };


    function changePositionBuilding(row, column) {

        if (surfaceTiles[row][column]) {
            alert("Destination should be empty tile!!!");
            return
        };


        obj = surfaceTiles[selectedBuilding.row][selectedBuilding.column];



        transform.scale.set(
            1,
            1,
            1,
        );

        var [x, z] = calculatePosition(row, column);

        transform.position.set(
            x,
            groundTiles[row][column].elevation,
            z);
        transform.updateMatrix();

        meshDict[obj.type].setMatrixAt(obj.instanceId, transform.matrix);
        meshDict[obj.type].instanceMatrix.needsUpdate = true;

        surfaceTiles[row][column] = surfaceTiles[obj.row][obj.column];
        surfaceTiles[obj.row][obj.column] = 0;
        surfaceTiles[row][column].row = row;
        surfaceTiles[row][column].column = column;
        surfaceTiles[row][column].elevation = groundTiles[row][column];

        clearSelectedTile();
        fillSelectedTile(row, column);

        expenses += 200;
        totalAvailableMoney -= 200;
        budgetPanelUpdate();
    };


    function createBuilding(type, row, column, height = 100, size = 6) {

        var [x, z] = calculatePosition(row, column);



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
            type, row, column, height, groundTiles[row][column], meshDictIndex[type][0] - 1)

    };


    function createSurfaceObject(
        type, row, column, height, elevation, instanceId, size = 6, peopleOnIt=50, floodInsurance=false) {

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
        return tempTile;

    };


    function showTilePanels(empty, nonempty, event) {

        //updateTilePanels(empty, nonempty);
        if (empty == 1) {
            document.getElementById("emptyTileContainer").style.display = "block";
            //document.getElementById( "emptyTileContainer" ).style.left = event.pageX+"px";
            //document.getElementById( "emptyTileContainer" ).style.top = event.pageY+"px";
            document.getElementById("emptyTileContainer").style.left = event.pageX + "px";
            document.getElementById("emptyTileContainer").style.top = event.pageY + "px";
            document.getElementById("emptyTileContainer").style.position = "absolute";
        } else {
            document.getElementById("emptyTileContainer").style.display = "none";
        };
        if (nonempty == 1) {
            document.getElementById("nonEmptyTileContainer").style.display = "block";
            document.getElementById("nonEmptyTileContainer").style.left = event.pageX + "px";
            document.getElementById("nonEmptyTileContainer").style.top = event.pageY + "px";
            document.getElementById("nonEmptyTileContainer").style.position = "absolute";
        } else {
            document.getElementById("nonEmptyTileContainer").style.display = "none";
        };

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


        updateBorderHeight(row, column, elevation, 140, 55);

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
        meshDict[selectedTile.meshName].setMatrixAt(selectedTile.instanceId, transform.matrix);
        meshDictIndex[selectedTile.meshName][1].push(selectedTile.instanceId);
        meshDict[selectedTile.meshName].instanceMatrix.needsUpdate = true;

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


    // it can be generalize to remove any instance

    function deleteBuilding() {

        transform.scale.set(0, 0, 0);
        transform.position.set(-10, -10, -10);
        transform.updateMatrix();

        meshDict[selectedBuilding.meshName].setMatrixAt(selectedBuilding.instanceId, transform.matrix);
        meshDictIndex[selectedBuilding.meshName][1].push(selectedBuilding.instanceId);
        meshDict[selectedBuilding.meshName].instanceMatrix.needsUpdate = true;

        surfaceTiles[selectedBuilding.row][selectedBuilding.column] = 0;
    };


    function borderPosition(row, column, elevation, size = 50) {

        var [x, z] = calculatePosition(row, column);
        var left, right, top, bottom;

        left = [x - size * Math.sqrt(2), elevation, z];
        right = [x + size * Math.sqrt(2), elevation, z];
        top = [x, elevation, z - size * Math.sqrt(2)];
        bottom = [x, elevation, z + size * Math.sqrt(2)];

        return [].concat(left, bottom, right, top);

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


    function changeColorOfMitigatedRegions(type=0) {

        var regions = findMitigatedRegions(type);

        var newColor2 = [1, 0, 1];

        for (var i = 0; i < regions.length; i++) {

            var [row1, column1] = regions[i];
            updateBorderColor(row1, column1, newColor2);
        };

    };

    function findMitigatedRegions(type=0) {

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

    function findNumberOfMitigatedRegions(){
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

    function clearColorOfMitigatedRegions(type=0) {

        var regions = findMitigatedRegions(type);

        var newColor2 = [0, 0, 0];

        for (var i = 0; i < regions.length; i++) {

            var [row1, column1] = regions[i];
            updateBorderColor(row1, column1, newColor2);
        };
    };

    function changeColorOfRiskyRegions() {

        var positions_of_regions = findRiskyAreas();
        var newColor1 = [1, 1, 0];

        for (var i = 0; i < positions_of_regions.length; i++) {

            var [row1, column1] = positions_of_regions[i];
            updateBorderColor(row1, column1, newColor1);
        };
    };

    function clearColorOfRiskyRegions() {

        var positions_of_regions = findRiskyAreas();
        var newColor1 = [0, 0, 0];

        for (var i = 0; i < positions_of_regions.length; i++) {

            var [row1, column1] = positions_of_regions[i];
            updateBorderColor(row1, column1, newColor1);
        };
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
        console.log(frame1);

        for (var i = 0; i < 4; i++) {
            frame1.geometry.attributes.position.array[i * 3] = positions[i * 3];
            frame1.geometry.attributes.position.array[1 + i * 3] = elevation;
            frame1.geometry.attributes.position.array[2 + i * 3] = positions[2 + i * 3];
        };

        frame1.geometry.attributes.position.needsUpdate = true;

    };


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
        lsMaterial.linewidth = 1;
        borderSegments = new THREE.LineSegments(bufferGeom, lsMaterial);
        borderSegments.name = "borderSegments";

        scene.add(borderSegments);

    };


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
                //visibilityOfDamagePanel(true);
                clearColorOfRiskyRegions();
                element.innerHTML = "Time is up!";
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


    function minMax(value, minElevationn = minElevation, maxElevationn = maxElevation, min = 10, max = 150) {
        var normalizedValue;

        normalizedValue = Math.floor(((value - minElevationn) / (maxElevationn - minElevationn)) * (max - min) + min + Math.random() * 2);
        //normalizedValue = value;
        return normalizedValue;
    };

    function findRiskyAreas() {

        var obj;

        var positions_of_risky_regions = [];

        for (var i = 0; i < numberOfRows; i++) {
            for (var j = 0; j < numberOfColumns; j++) {
                obj = floodTiles[i][j];

                if (obj != 0) {
                    positions_of_risky_regions.push([i, j]);
                };
            };
        };

        return positions_of_risky_regions;

    };


    function encode(s) {
        var out = [];
        for (var i = 0; i < s.length; i++) {
            out[i] = s.charCodeAt(i);
        }
        return new Uint8Array(out);
    };


    function hasMitigation(row, column) {

        var result = false;

        if (groundTiles[row][column].elevateStructure != 0 ||
            groundTiles[row][column].sandbag != 0 ||
            groundTiles[row][column].floodWall != 0 ||
            groundTiles[row][column].floodInsurance != false) {

            result = true;
        };

        if (surfaceTiles[row][column] != 0) {
            if (surfaceTiles[row][column].floodInsurance != false) {
                result = true;
            }
        }

        return result;
    }

    function hasMitigationType(row, column, type) {
    	/*
			It checks whether the tile has specific type of mitigation.
    	*/

    	var result = false;
    	if (type == 0){
	        if (groundTiles[row][column].elevateStructure != 0 ||
	            groundTiles[row][column].sandbag != 0 ||
	            groundTiles[row][column].floodWall != 0 ||
	            groundTiles[row][column].floodInsurance != false) {

	            result = true;
	        };

	        if (surfaceTiles[row][column] != 0) {
	            if (surfaceTiles[row][column].floodInsurance != false) {
	                result = true;
	            }
	        }
    	}
    	else if (type == 1){
    		// Check Elevate Structure
    		if (groundTiles[row][column].elevateStructure != 0){
    			result = true;
    		};
    	}
    	else if (type == 2){
    		// Check Flood Wall
    		if (groundTiles[row][column].floodWall != 0){
    			result = true;
    		};

    	}
    	else if (type == 3){
    		// Check sandbag
    		if (groundTiles[row][column].sandbag != 0){
    			result = true;
    		};
    	}
    	else if (type == 4){
    		if (groundTiles[row][column].floodInsurance != false){
    			result = true;
    		};
        	if (surfaceTiles[row][column] != 0) {
            	if (surfaceTiles[row][column].floodInsurance != false) {
                	result = true;
            	};
        	};
    	}
    	else {
    		result = false
    	};

        return result;
    }

    function downloadCurrentDocument(ehhhe, fileName) {
        var data = encode(JSON.stringify(ehhhe, null, 4));
        var blob = new Blob([data], {
            type: 'application/octet-stream'
        });

        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName + '.json');
        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        link.dispatchEvent(event);

    };

    function addStructureCost(structure) {

        if (structure == "b1") {
            return 100;
        } else if (structure == "b2") {
            return 125;
        } else if (structure == "b3") {
            return 200;
        } else if (structure == "s1") {
            return 150;
        } else {
            return 0;
        };
    };

    function addFloodWallCost(structure) {

        if (structure == "3") {
            return 100;
        } else if (structure == "5") {
            return 125;
        } else if (structure == "10") {
            return 200;
        } else {
            return 0;
        };
    };

    function addSandBagCost(structure) {

        if (structure == "3") {
            return 90;
        } else if (structure == "5") {
            return 105;
        } else if (structure == "10") {
            return 120;
        } else {
            return 0;
        };
    };

    function openInformationPanel(option) {

        if (option == 1) {
            $("#infoButton").click();
            $("#v-pills-mitigation-options-tab").click();
            $("#v-pills-mitigation-options-subcategory-tab1").click();
        } else if (option == 2) {
            $("#infoButton").click();
            $("#v-pills-mitigation-options-tab").click();
            $("#v-pills-mitigation-options-subcategory-tab2").click();

        } else if (option == 3) {
            $("#infoButton").click();
            $("#v-pills-mitigation-options-tab").click();
            $("#v-pills-mitigation-options-subcategory-tab3").click();

        } else if (option == 4) {
            $("#infoButton").click();
            $("#v-pills-mitigation-options-tab").click();
            $("#v-pills-mitigation-options-subcategory-tab4").click();
        } else if (option == 5) {
            $("#infoButton").click();
            $("#v-pills-mitigation-options-tab").click();
            $("#v-pills-mitigation-options-subcategory-tab5").click();
        } else if (option == 6) {
            $("#infoButton").click();
            $("#v-pills-mitigation-options-tab").click();
            $("#v-pills-mitigation-options-subcategory-tab6").click();
        } else if (option == 7) {
            $("#infoButton").click();
            $("#v-pills-mitigation-options-tab").click();
            $("#v-pills-mitigation-options-subcategory-tab7").click();
        } else if (option == 8) {
            $("#infoButton").click();
            $("#v-pills-mitigation-options-tab").click();
            $("#v-pills-mitigation-options-subcategory-tab8").click();
        } else {
            openInformationPanel(1);
        };
    };

    function tileInformationPanelUpdate() {

        document.getElementById("tileType").innerHTML = groundTiles[selectedTile.row][selectedTile.column].type;
        document.getElementById("tileElevation").innerHTML = selectedTile.elevation;
        if (selectedBuilding.isSelected){
        	document.getElementById("tilePeople").innerHTML = selectedBuilding.peopleOnIt;
        }
        else{
        	document.getElementById("tilePeople").innerHTML = 0;
        }
    }

    function budgetPanelUpdate() {

        var budgetPanel = document.querySelectorAll("#budgetPanel li span");

        budgetPanel[0].innerHTML = "$50000";

        budgetPanel[1].innerHTML = " $" + (expenses).toFixed(0);
        budgetPanel[2].innerHTML = " $" + (totalAvailableMoney).toFixed(0);
        quickSummaryPanelUpdate();
    }

    function quickSummaryPanelUpdate() {

        var budgetPanel = document.querySelectorAll("#quickSummary li span");

        budgetPanel[0].innerHTML = 0;

        budgetPanel[1].innerHTML = findNumberOfMitigatedRegions();
        budgetPanel[2].innerHTML = findNumberofRiskyAreas();
    }

    function mitigationPanelNonEmpty() {

        var nonEmptyOptions = document.querySelectorAll("#nonEmptyOptions [type='checkbox']");

        // Relocate Structure
        nonEmptyOptions[0].onclick = function() {
            selectedBuilding.isMove = true;
        };

        //Remove Structure
        nonEmptyOptions[1].onclick = function() {
            deleteBuilding();
            clearSelectedTile();
            expenses += 200;
            totalAvailableMoney -= 200;
            budgetPanelUpdate();
            showMitigationOptions(1);
            enableAllCheckBox(false);
        };

        //Elevate Structure
        nonEmptyOptions[2].onclick = function() {
            if (this.checked) {
                groundTiles[selectedTile.row][selectedTile.column].elevateStructure = document.getElementById("elevateSection").value;
                expenses += document.getElementById("elevateSection").value * 100;
                totalAvailableMoney -= document.getElementById("elevateSection").value * 100;
                budgetPanelUpdate();
                document.getElementById("elevateSection").disabled = true;
            } else {
                groundTiles[selectedTile.row][selectedTile.column].elevateStructure = 0;
                expenses -= document.getElementById("elevateSection").value * 100;
                totalAvailableMoney += document.getElementById("elevateSection").value * 100;
                budgetPanelUpdate();
                document.getElementById("elevateSection").disabled = false;
            };
        };

        //FloodWall
        nonEmptyOptions[3].onclick = function() {
            if (this.checked) {
                groundTiles[selectedTile.row][selectedTile.column].floodWall = nonEmptyOptionsSelect[0].value;
                expenses += addFloodWallCost(nonEmptyOptionsSelect[0].value);
                totalAvailableMoney -= addFloodWallCost(nonEmptyOptionsSelect[0].value);
                nonEmptyOptionsSelect[0].disabled = true;
                budgetPanelUpdate();
            } else {
                groundTiles[selectedTile.row][selectedTile.column].floodWall = 0;
                expenses -= addFloodWallCost(nonEmptyOptionsSelect[0].value);
                totalAvailableMoney += addFloodWallCost(nonEmptyOptionsSelect[0].value);
                nonEmptyOptionsSelect[0].disabled = false;
                budgetPanelUpdate();
            }
        };

        //Sand Bag
        nonEmptyOptions[4].onclick = function() {
            if (this.checked) {
                groundTiles[selectedTile.row][selectedTile.column].sandbag = nonEmptyOptionsSelect[1].value;
                expenses += addSandBagCost(nonEmptyOptionsSelect[1].value);
                totalAvailableMoney -= addSandBagCost(nonEmptyOptionsSelect[1].value);
                nonEmptyOptionsSelect[1].disabled = true;
                budgetPanelUpdate();
            } else {
                groundTiles[selectedTile.row][selectedTile.column].sandbag = 0;
                expenses -= addSandBagCost(nonEmptyOptionsSelect[1].value);
                totalAvailableMoney += addSandBagCost(nonEmptyOptionsSelect[1].value);
                nonEmptyOptionsSelect[1].disabled = false;
                budgetPanelUpdate();
            };

        };

        // Insurance Checkbox
        nonEmptyOptions[5].onclick = function() {
            if (this.checked) {
                groundTiles[selectedTile.row][selectedTile.column].floodInsurance = true;
                expenses += 200;
                totalAvailableMoney -= 200;
                surfaceTiles[selectedTile.row][selectedTile.column].floodInsurance = true;
                //expenses += 400;
                //totalAvailableMoney -= 400;
                budgetPanelUpdate();
            } else {
                groundTiles[selectedTile.row][selectedTile.column].floodInsurance = false;
                expenses -= 200;
                totalAvailableMoney += 200;
                surfaceTiles[selectedTile.row][selectedTile.column].floodInsurance = false;
                //expenses -= 400;
                //totalAvailableMoney += 400;
                budgetPanelUpdate();
            };
        };
    };

    function mitigationPanelEmpty() {

        var emptyOptions = document.querySelectorAll("#emptyOptions [type='checkbox']");

        //Add Structure
        emptyOptions[0].onclick = function() {
            createBuilding(
                emptyOptionsSelect[0].value,
                selectedTile.row,
                selectedTile.column);
            clearSelectedTile();
            expenses += addStructureCost(emptyOptionsSelect[0].value);
            totalAvailableMoney -= addStructureCost(emptyOptionsSelect[0].value);
            budgetPanelUpdate();
            showMitigationOptions(0);
            enableAllCheckBox(false);
        };

        //Change Tile
        emptyOptions[1].onclick = function() {
            changeTileType(
                emptyOptionsSelect[1].value,
                selectedTile.row,
                selectedTile.column
            );
            clearSelectedTile();
            emptyOptions[1].checked = false;
            expenses += 100;
            totalAvailableMoney -= 100;
            budgetPanelUpdate();
        };

        //FloodWall
        emptyOptions[2].onclick = function() {
            if (this.checked) {
                groundTiles[selectedTile.row][selectedTile.column].floodWall = emptyOptionsSelect[2].value;
                expenses += addFloodWallCost(emptyOptionsSelect[2].value);
                totalAvailableMoney -= addFloodWallCost(emptyOptionsSelect[2].value);
                emptyOptionsSelect[2].disabled = true;
                budgetPanelUpdate();
            } else {
                groundTiles[selectedTile.row][selectedTile.column].floodWall = 0;
                expenses -= addFloodWallCost(emptyOptionsSelect[2].value);
                totalAvailableMoney += addFloodWallCost(emptyOptionsSelect[2].value);
                emptyOptionsSelect[2].disabled = false;
                budgetPanelUpdate();
            }
        };

        //Sand Bag
        emptyOptions[3].onclick = function() {
            if (this.checked) {
                groundTiles[selectedTile.row][selectedTile.column].sandbag = emptyOptionsSelect[3].value;
                expenses += addSandBagCost(emptyOptionsSelect[3].value);
                totalAvailableMoney -= addSandBagCost(emptyOptionsSelect[3].value);
                emptyOptionsSelect[3].disabled = true;
                budgetPanelUpdate();
            } else {
                groundTiles[selectedTile.row][selectedTile.column].sandbag = 0;
                expenses -= addSandBagCost(emptyOptionsSelect[3].value);
                totalAvailableMoney += addSandBagCost(emptyOptionsSelect[3].value);
                emptyOptionsSelect[3].disabled = false;
                budgetPanelUpdate();
            }

        };

        // Insurance Checkbox
        emptyOptions[4].onclick = function() {
            if (this.checked) {
                groundTiles[selectedTile.row][selectedTile.column].floodInsurance = true;
                expenses += 200;
                totalAvailableMoney -= 200;
                budgetPanelUpdate();
            } else {
                groundTiles[selectedTile.row][selectedTile.column].floodInsurance = false;
                expenses -= 200;
                totalAvailableMoney += 200;
                budgetPanelUpdate();
            };
        };
    };

    function showMitigationOptions(emptyTile) {

        if (emptyTile) {
            document.getElementById("emptyOptions").style.display = "";
            document.getElementById("nonEmptyOptions").style.display = "none";
        } else {
            document.getElementById("emptyOptions").style.display = "none";
            document.getElementById("nonEmptyOptions").style.display = "";
        };

    };

    function updateNonEmptyOptions(row, column) {
        var nonEmptyOptionsUpdateCheckbox = document.querySelectorAll("#nonEmptyOptions [type='checkbox']");

        var tempGroundTiles1 = groundTiles[row][column];

        //Relocate Structure
        nonEmptyOptionsUpdateCheckbox[0].checked = false

        //Remove Structure
        nonEmptyOptionsUpdateCheckbox[1].checked = false

        //Elevate Structure
        if (tempGroundTiles1.elevateStructure > 0) {
            nonEmptyOptionsUpdateCheckbox[2].checked = true
            costValuesNonEmpty[2].innerHTML = "$" + document.getElementById("elevateSection").value * 100;
            document.getElementById("elevateSection").disabled = true;
        } else {
            nonEmptyOptionsUpdateCheckbox[2].checked = false;
            document.getElementById("elevateSection").disabled = false;
        };

        //Flood Wall
        if (tempGroundTiles1.floodWall > 0) {
            nonEmptyOptionsUpdateCheckbox[3].checked = true
            nonEmptyOptionsSelect[0].selectedIndex = helperForFeetToIndex(tempGroundTiles1.floodWall);
            costValuesNonEmpty[3].innerHTML = "$" + addSandBagCost(nonEmptyOptionsSelect[0].value);
            nonEmptyOptionsSelect[0].disabled = true;
        } else {
            nonEmptyOptionsUpdateCheckbox[3].checked = false;
            nonEmptyOptionsSelect[0].disabled = false;
        };
        //Sand Bag
        if (tempGroundTiles1.sandbag > 0) {
            nonEmptyOptionsUpdateCheckbox[4].checked = true
            nonEmptyOptionsSelect[1].selectedIndex = helperForFeetToIndex(tempGroundTiles1.sandbag);
            costValuesNonEmpty[4].innerHTML = "$" + addSandBagCost(nonEmptyOptionsSelect[1].value);
            nonEmptyOptionsSelect[1].disabled = true;
        } else {
            nonEmptyOptionsUpdateCheckbox[4].checked = false;
            nonEmptyOptionsSelect[1].disabled = false;
        };
        //Insurance
        if (tempGroundTiles1.floodInsurance) {
            nonEmptyOptionsUpdateCheckbox[5].checked = true
        } else {
            nonEmptyOptionsUpdateCheckbox[5].checked = false
        };
    }

    function helperForFeetToIndex(number) {
        // It gives selected index according to sandbag and floodwall

        if (number == 3) { return 0; } else if (number == 5) { return 1; } else { return 2; };
    }


    function helperForChangeTile(typeTile){

    	if (typeTile == "w1" || typeTile == "g1" || typeTile == "c1"){
    		return true
    	}
    	else {return false};
    }


    function helperForChangeTile2(typeTile){
    	if (typeTile == "w1"){
    		return [0, 1, 2]
    	}
    	else if (typeTile == "c1"){
    		return [1, 0, 2]
    	}
    	else if (typeTile == "g1"){
    		return [2, 0, 1]
    	}
    	else {
    		return [0, 1, 2]
    	};
    }

    function updateEmptyOptions(row, column) {
        var emptyOptionsUpdateCheckbox = document.querySelectorAll("#emptyOptions [type='checkbox']");

        var tempGroundTiles1 = groundTiles[row][column];

        //Add Structure
        if (tempGroundTiles1.type == "c1"){
        	emptyOptionsUpdateCheckbox[0].disabled = false;
        }
        else{
        	emptyOptionsUpdateCheckbox[0].disabled = true;
        }
        emptyOptionsUpdateCheckbox[0].checked = false

        //Change Tile
        if (helperForChangeTile(tempGroundTiles1.type)) {
        	var [t1, t2, t3] = helperForChangeTile2(tempGroundTiles1.type);
        	emptyOptionsSelect[1].selectedIndex = t2;
        	emptyOptionsSelect[1].options[t1].disabled = true;
        	emptyOptionsSelect[1].options[t2].disabled = false;
        	emptyOptionsSelect[1].options[t3].disabled = false;
            //emptyOptionsUpdateCheckbox[1].checked = true
        } else {
        	emptyOptionsSelect[1].selectedIndex = 0;
        	emptyOptionsSelect[1].options[0].disabled = false;
        	emptyOptionsSelect[1].options[1].disabled = false;
        	emptyOptionsSelect[1].options[2].disabled = false;
            //emptyOptionsUpdateCheckbox[1].checked = false
        };

        //Flood Wall
        if (tempGroundTiles1.floodWall > 0) {
            emptyOptionsUpdateCheckbox[2].checked = true;
            emptyOptionsSelect[2].selectedIndex = helperForFeetToIndex(tempGroundTiles1.floodWall);
            costValuesEmpty[2].innerHTML = "$" + addSandBagCost(emptyOptionsSelect[2].value);
            emptyOptionsSelect[2].disabled = true;
        } else {
            emptyOptionsUpdateCheckbox[2].checked = false;
            emptyOptionsSelect[2].disabled = false;

        };
        //Sand Bag
        if (tempGroundTiles1.sandbag > 0) {
            emptyOptionsUpdateCheckbox[3].checked = true;
            emptyOptionsSelect[3].selectedIndex = helperForFeetToIndex(tempGroundTiles1.sandbag);
            costValuesEmpty[3].innerHTML = "$" + addSandBagCost(emptyOptionsSelect[3].value);
            emptyOptionsSelect[3].disabled = true;

        } else {
            emptyOptionsUpdateCheckbox[3].checked = false
            emptyOptionsSelect[3].disabled = false;
        };
        //Insurance
        if (tempGroundTiles1.floodInsurance) {
            emptyOptionsUpdateCheckbox[4].checked = true
        } else {
            emptyOptionsUpdateCheckbox[4].checked = false
        };
    }

    function updateSelectCostValue() {



        // Add Structure
        emptyOptionsSelect[0].onclick = function() {
            costValuesEmpty[0].innerHTML = "$" + addStructureCost(this.value);
        }
        // Change Tile

        // Flood Wall Empty
        emptyOptionsSelect[2].onclick = function() {
            costValuesEmpty[2].innerHTML = "$" + addFloodWallCost(this.value);
        }
        // Sand Bag Empty
        emptyOptionsSelect[3].onclick = function() {
            costValuesEmpty[3].innerHTML = "$" + addSandBagCost(this.value);
        }
        // Flood Wall NonEmpty
        nonEmptyOptionsSelect[0].onclick = function() {
            costValuesNonEmpty[3].innerHTML = "$" + addFloodWallCost(this.value);
        }
        // Sand Bag NonEmpty
        nonEmptyOptionsSelect[1].onclick = function() {
            costValuesNonEmpty[4].innerHTML = "$" + addSandBagCost(this.value);
        }
        document.getElementById("elevateSection").onclick = function(){
        	costValuesNonEmpty[2].innerHTML = "$" + this.value * 100;
        }
        // Insurance

    };


    function calculateTotalDamage(){
    	/*
			It calculates the total damage in terms of money
    	*/

        var totalBuilding = 0;
        var total = 0;
        updateFloodInformation();
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (obj != 0) {
                    if (obj.height > 0) {
                        total++;
                        if (surfaceTiles[row][column] != 0)
                            totalBuilding++;
                    };
                };
            };
        };

        return totalBuilding * 200 + (total - totalBuilding) * 200;

    };

    function calculateInsurancedMoney(){
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
                    	if (groundTiles[row][column].floodInsurance){
                        	total++;
                        	if (surfaceTiles[row][column] != 0){
                            	if(surfaceTiles[row][column].floodInsurance){
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

    function findNumberofEffectedPeople(){
    	/*
			It calculates the number of people is affected by the flood.
    	*/

    	var totalAffectedPeople = 0
    	updateFloodInformation();
    	for ( var row = 0; row < numberOfRows; row++ ){
    		for (var column = 0; column < numberOfColumns; column++){
    			obj = floodTiles[row][column];
    			if (obj.height > 0) {
    				if (surfaceTiles[row][column] != 0){
    					totalAffectedPeople += surfaceTiles[row][column].peopleOnIt;
    				}
    			}
    		}
    	}
    	return totalAffectedPeople;

    }

    function guiButtonSetUp() {

        var controlSection = document.querySelectorAll("#controlSection button");

        // Time Button

        // Show Mitigated Areas
        controlSection[1].onclick = function() {
            if (this.value == "true") {
                changeColorOfMitigatedRegions();
                this.innerHTML = "Clear Mitigated Areas";
                this.value = false;
            } else {
                clearColorOfMitigatedRegions();
                this.innerHTML = "Show Mitigated Areas";
                this.value = true;
            }
        };
        // Show Risky Areas
        controlSection[2].onclick = function() {
            if (this.value == "true") {
                changeColorOfRiskyRegions();
                this.innerHTML = "Clear Risky Areas";
                this.value = false;
            } else {
                clearColorOfRiskyRegions();
                this.innerHTML = "Show Risky Areas";
                this.value = true;
            };
        };

        // Start
        controlSection[3].onclick = function() {
            if (this.value == "start") {
                countdown("time", 10, 0);
                this.value = "finish";
                this.innerHTML = "Finish"
            } else {
            	finishGame = 1000000;
            };
        }
        // Zoom In
        controlSection[4].onclick = function() {
            zoom /= 2;

            if (zoom == 1) {

                var v1 = new THREE.Vector3(-3000, 0, -3600);
                var v2 = new THREE.Vector3(2900, 0, 3800);
                bb = new THREE.Box3(v1, v2);

                cameraControls.setBoundary(bb);
                cameraControls.zoom(0.25, true);

            } else if (zoom == 2) {

                var v1 = new THREE.Vector3(-2700, 0, -3250);
                var v2 = new THREE.Vector3(2600, 0, 3400);
                bb = new THREE.Box3(v1, v2);

                cameraControls.setBoundary(bb);
                cameraControls.zoom(0.25, true);
            } else if (zoom == 4) {

                var v1 = new THREE.Vector3(-2100, 0, -2500);
                var v2 = new THREE.Vector3(2000, 0, 2650);
                bb = new THREE.Box3(v1, v2);

                cameraControls.setBoundary(bb);
                cameraControls.zoom(0.1, true);

            }
            /*
            else if (zoom == 8){

            	var v1 = new THREE.Vector3(-3200, 0, -400);
            	var v2 = new THREE.Vector3( 3200, 0, 400);
            	bb = new THREE.Box3(v1, v2);

            	//cameraControls.setBoundary(bb);
            	cameraControls.zoom(0.15, true);

            }
            */
            else {

                zoom *= 2;

            };
        }

        // Zoom Out
        controlSection[5].onclick = function() {
            zoom *= 2;

            if (zoom == 2) {

                var v1 = new THREE.Vector3(-2700, 0, -3250);
                var v2 = new THREE.Vector3(2600, 0, 3400);
                bb = new THREE.Box3(v1, v2);

                cameraControls.setBoundary(bb);
                cameraControls.zoom(-0.25, true);

            } else if (zoom == 4) {

                var v1 = new THREE.Vector3(-2100, 0, -2500);
                var v2 = new THREE.Vector3(2000, 0, 2650);
                bb = new THREE.Box3(v1, v2);

                cameraControls.setBoundary(bb);
                cameraControls.zoom(-0.25, true);

            } else if (zoom == 8) {

                var v1 = new THREE.Vector3(-1700, 0, -1950);
                var v2 = new THREE.Vector3(1600, 0, 2050);
                bb = new THREE.Box3(v1, v2);

                cameraControls.setBoundary(bb);
                cameraControls.zoom(-0.1, true);
            }
            /*
            else if (zoom == 16){

            	v1 = new THREE.Vector3(-5150, 0, -1200);
            	v2 = new THREE.Vector3( 4875, 0, 1150);
            	bb = new THREE.Box3(v1, v2);

            	//cameraControls.setBoundary(bb);
            	cameraControls.zoom(-0.15, true);
            }
            */
            else {
                zoom /= 2;
            };
        }

        // Reset


    }
};

main();