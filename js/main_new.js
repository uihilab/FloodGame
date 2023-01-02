import { createTiles } from "./createWorldData_fromExportedMaps.js";
import { createMeshes } from "./loadModels.js";
import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import CameraControls from "./../libs/camera-controls/dist/camera-controls.module.js"
import * as holdEvent from "./../libs/camera-controls/dist/hold-event.module.js";
import { LineMaterial } from './../libs/three.js-dev/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './../libs/three.js-dev/examples/jsm/lines/LineGeometry.js';
import { GeometryUtils } from './../libs/three.js-dev/examples/jsm/utils/GeometryUtils.js';
import { LineSegments2 } from './../libs/three.js-dev/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from './../libs/three.js-dev/examples/jsm/lines/LineSegmentsGeometry.js';



function main() {

    var camera, scene, renderer, stats, gui, spotLight;
    var container = document.getElementById("webgl-output");
    var cameraControls;
    const clock = new THREE.Clock();

    var groundTiles, surfaceTiles, surfaceTiles_v2, pos_of_objects, floodTiles, countMap, floodData;
    var minElevation, maxElevation;
    var totalCostAtTheStart;
    var meshDict, meshDictIndex, floodMesh;
    var borderSegments;

    var frame1, frame2;

    var obj;
    var totalAvailableMoney = 50000000;
    var expenses = 0;

    var initialBuilding, initialEffectedBuilding, initialCriticalBuilding, initialEffectedCriticalBuilding;
    var initialPeople, initialEffectedPeople;

    var tileSize = 100;
    var numberOfTiles = 5625;
    var numberOfTiles_X = Math.pow(numberOfTiles, 0.5)
    var side_length = numberOfTiles_X * tileSize;
    var numberOfRows = 100;
    var numberOfColumns = 100;

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


    var v1 = new THREE.Vector3(-4950, 0, -4950);
    var v2 = new THREE.Vector3(4950, 0, 4950);
    var bb = new THREE.Box3(v1, v2);


    var tileElevation; //??

    var tileFolder, buildingFolder, tileActions, buildingActions;
    var mitigationFolder;

    // dictInstancedIdtoSurfacePosition dict contains instancedId of trees and roads and their corresponding array position.
    var dictInstancedIdtoSurfacePosition = {};
    dictInstancedIdtoSurfacePosition["road_v"] = {};
    dictInstancedIdtoSurfacePosition["road_h"] = {};
    dictInstancedIdtoSurfacePosition["road_c"] = {};
    dictInstancedIdtoSurfacePosition["tree"] = {};

    // dictSurfacePositiontoInstancedId dict contains array positions of trees and roads and their corresponding instancedIds.
    var dictSurfacePositiontoInstancedId = {};
    dictSurfacePositiontoInstancedId["road_v"] = {};
    dictSurfacePositiontoInstancedId["road_h"] = {};
    dictSurfacePositiontoInstancedId["road_c"] = {};
    dictSurfacePositiontoInstancedId["tree"] = {};


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


    var buildingMetaDict = {
        "Res1": {
            "name": "Small Residential",
            "type": "General",
            "Occupants": 5,
            "Area": 2200,
            "Perimeter": 190,
            "Str_val": 330000,
            "Cont_val": 165000,
            "Unit_val": 150,
            "str_func": [0, 10, 21, 22, 23, 25, 27, 30, 35, 40, 43, 45, 48, 50, 52, 54, 56, 58, 60, 60, 60, 60, 60, 60, 60],
            "cont_func": [0, 8, 12, 17, 19, 22, 24, 25, 30, 35, 38, 39, 40, 42, 43, 44, 45, 47, 48, 49, 50, 52, 53, 54, 56]
        },
        "Res2": {
            "name": "Medium Residential",
            "type": "General",
            "Occupants": 20,
            "Area": 1400,
            "Perimeter": 150,
            "Str_val": 210000,
            "Cont_val": 105000,
            "Unit_val": 150,
            "str_func": [0, 14, 25, 38, 51, 65, 74, 82, 83, 84, 85, 86, 88, 89, 90, 91, 92, 94, 95, 96, 97, 98, 99, 100, 100],
            "cont_func": [0, 27, 49, 64, 70, 76, 78, 79, 81, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83, 83]
        },
        "Res3": {
            "name": "Large Residential",
            "type": "General",
            "Occupants": 40,
            "Area": 4000,
            "Perimeter": 250,
            "Str_val": 600000,
            "Cont_val": 300000,
            "Unit_val": 150,
            "str_func": [0, 28, 29, 31, 36, 37, 39, 40, 41, 42, 44, 46, 48, 52, 55, 58, 61, 64, 68, 69, 70, 71, 72, 73, 74],
            "cont_func": [0, 34, 44, 55, 67, 77, 87, 97, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
        },
        "Com": {
            "name": "Commercial",
            "type": "General",
            "Occupants": "N/A",
            "Area": 5000,
            "Perimeter": 280,
            "Str_val": 800000,
            "Cont_val": 800000,
            "Unit_val": 160,
            "str_func": [0, 9, 14, 16, 18, 20, 23, 26, 30, 34, 38, 42, 47, 51, 55, 58, 61, 64, 67, 69, 71, 74, 76, 78, 80],
            "cont_func": [0, 26, 42, 56, 68, 78, 83, 85, 87, 88, 89, 90, 91, 92, 92, 92, 93, 93, 94, 94, 94, 94, 94, 94, 94]
        },
        "Ind": {
            "name": "Industrial",
            "type": "General",
            "Occupants": "N/A",
            "Area": 10000,
            "Perimeter": 400,
            "Str_val": 1800000,
            "Cont_val": 2160000,
            "Unit_val": 180,
            "str_func": [0, 12, 14, 17, 19, 23, 27, 31, 35, 40, 45, 50, 55, 60, 60, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70],
            "cont_func": [0, 15, 24, 34, 41, 47, 52, 57, 60, 63, 64, 66, 68, 69, 72, 73, 73, 73, 74, 74, 74, 74, 75, 75, 75]
        },
        "Hos": {
            "name": "Hospital",
            "type": "Critical",
            "Occupants": "N/A",
            "Area": 10000,
            "Perimeter": 400,
            "Str_val": 25000000,
            "Cont_val": 25000000,
            "Unit_val": 2500,
            "str_func": [0, 0, 0, 20, 25, 30, 35, 40, 43, 47, 50, 53, 55, 57, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60],
            "cont_func": [0, 0, 0, 10, 20, 30, 65, 72, 78, 85, 95, 95, 95, 95, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96]
        },
        "Fire": {
            "name": "Fire Station",
            "type": "Critical",
            "Occupants": "N/A",
            "Area": 4000,
            "Perimeter": 250,
            "Str_val": 460000,
            "Cont_val": 760000,
            "Unit_val": 190,
            "str_func": [0, 1, 5, 5, 5, 6, 7, 9, 11, 14, 17, 20, 24, 28, 32, 36, 41, 45, 51, 56, 61, 66, 71, 76, 81],
            "cont_func": [0, 10, 25, 50, 75, 91, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
        },
        "Pol": {
            "name": "Police Station",
            "type": "Critical",
            "Occupants": "N/A",
            "Area": 400,
            "Perimeter": 80,
            "Str_val": 1200000,
            "Cont_val": 1200000,
            "Unit_val": 3000,
            "str_func": [0, 12, 14, 17, 19, 23, 27, 31, 35, 40, 45, 50, 55, 59, 63, 67, 71, 74, 77, 80, 83, 86, 89, 92, 95],
            "cont_func": [0, 5, 15, 25, 35, 48, 62, 78, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
        },
        "Wat": {
            "name": "Water Treatment",
            "type": "Critical",
            "Occupants": "N/A",
            "Area": 40000,
            "Perimeter": 800,
            "Str_val": 600000,
            "Cont_val": 1000000,
            "Unit_val": 300,
            "str_func": [0, 5, 8, 10, 17, 24, 30, 30, 30, 30, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
            "cont_func": [0, 5, 8, 10, 17, 24, 30, 30, 30, 30, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40]
        },
        "School": {
            "name": "School",
            "type": "Critical",
            "Occupants": "N/A",
            "Area": 7000,
            "Perimeter": 330,
            "Str_val": 170000,
            "Cont_val": 220000,
            "Unit_val": 240,
            "str_func": [0, 5, 7, 9, 9, 10, 11, 13, 15, 17, 20, 24, 28, 33, 39, 45, 52, 59, 64, 69, 74, 79, 84, 89, 94],
            "cont_func": [0, 27, 38, 53, 64, 68, 70, 72, 75, 79, 83, 88, 94, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
        }
    };

    var mitigationMetaDataNew = {
        "Sandbag": {
            "name": "Sandbag",
            "cost": {
                1: {
                    "Cost": 33
                },
                2: {
                    "Cost": 66
                },
                3: {
                    "Cost": 99
                }
            },
            "Type": "Building"
        },
        "Dryfloodproofing": {
            "name": "Dryfloodproofing",
            "cost": {
                1: {
                    "Cost": 12
                },
                2: {
                    "Cost": 23
                },
                3: {
                    "Cost": 37
                }
            },
            "Type": "Building"
        },
        "Wetfloodproofing": {
            "name": "Wetfloodproofing",
            "cost": {
                1: {
                    "Cost": 6
                },
                2: {
                    "Cost": 11
                },
                3: {
                    "Cost": 21
                }
            },
            "Type": "Building"
        },
        "ElevateStructure": {
            "name": "Elevate Structure",
            "cost": {
                1: {
                    "Cost": 30
                },
                2: {
                    "Cost": 35
                },
                3: {
                    "Cost": 37
                },
                4: {
                    "Cost": 39
                },
                5: {
                    "Cost": 40
                },
                6: {
                    "Cost": 42
                },
                7: {
                    "Cost": 43
                },
                8: {
                    "Cost": 45
                },
                9: {
                    "Cost": 48
                },
                10: {
                    "Cost": 54
                }
            },
            "Type": "Building"
        },
        "Insurance": {
            "name": "Insurance",
            "cost": {
                
                    "Res1": 0.01,
                    "Res2": 0.01,
                    "Res3": 0.01,
                    "Com": 0.005,
                    "Ind": 0.005,
                    "Hospital": 0.005,
                    "Fire": "N/A",
                    "Police": "N/A",
                    "Water": "N/A",
                    "School": "N/A"
            },
            "Type": "Building"
        },
        "Relocate": {
            "name": "Relocate",
            "cost": 81,
            "Type": "Building"
        },
        "Floodwall": {
            "name": "Floodwall",
            "cost": {
                1: {
                    "Cost": 38
                },
                2: {
                    "Cost": 76
                },
                3: {
                    "Cost": 143
                },
                4: {
                    "Cost": 190
                },
                "5foot": {
                    "Cost": 238
                },
                "6foot": {
                    "Cost": 250
                }
            },
            "Type": "Ground"
        },
        "Shelter1": {
            "name": "Shelter Low Cap",
            "Occupants": 100,
            "cost": {
                "N/A": {
                    "Ground": 300000
                }
            },
            "Type": "Ground"
        },
        "Shelter2": {
            "name": "Shelter Mid Cap",
            "Occupants": 250,
            "cost": {
                "N/A": {
                    "Ground": 500000
                }
            },
            "Type": "Ground"
        },
        "Shelter3": {
            "name": "Shelter High Cap",
            "Occupants": 500,
            "cost": {
                "N/A": {
                    "Ground": 800000
                }
            },
            "Type": "Ground"
        }
    };


    var mitigationMetaData = {
        "Wetfloodproofing": {
            "ground_tile": false,
            "structure_tile": true,
            "id": "wetfloodproofing_mit"
        },
        "Dryfloodproofing": {
            "ground_tile": false,
            "structure_tile": true,
            "id": "dryfloodproofing_mit"
        },
        "add_structure": {
            "opts": true,
            "cost": 250,
            "ground_tile": true,
            "structure_tile": false,
            "id": "add_structure_mit",
            "opts_values": {
                "Res1": {
                    "value": "Res1",
                    "text": "Building 1",
                    "cost": 465000
                },
                "Res2": {
                    "value": "Res2",
                    "text": "Building 2",
                    "cost": 315000
                },
                "Res3": {
                    "value": "Res3",
                    "text": "Building 3",
                    "cost": 900000
                },
                "Com": {
                    "value": "Res3",
                    "text": "Building 3",
                    "cost": 1600000
                },
                "Ind": {
                    "value": "Res3",
                    "text": "Building 3",
                    "cost": 3960000
                },
                "Hos": {
                    "value": "Res3",
                    "text": "Building 3",
                    "cost": 50000000
                },
                "Fire": {
                    "value": "Res3",
                    "text": "Building 3",
                    "cost": 1220000
                },
                "Pol": {
                    "value": "Res3",
                    "text": "Building 3",
                    "cost": 2400000
                },
                "Wat": {
                    "value": "Res3",
                    "text": "Building 3",
                    "cost": 1600000
                },
                "School": {
                    "value": "Res3",
                    "text": "Building 3",
                    "cost": 390000
                },

            },
        },
        "change_tile": {
            "opts": true,
            "cost": 250,
            "ground_tile": true,
            "structure_tile": false,
            "id": "change_tile_mit",
            "opts_values": {
                "w1": {
                    "value": "w1",
                    "text": "Water",
                    "cost": 160
                },
                "c1": {
                    "value": "c1",
                    "text": "Concrete",
                    "cost": 260
                },
                "g1": {
                    "value": "g1",
                    "text": "Grass",
                    "cost": 360
                }

            },
        },
        "flood_wall": {
            "name": "Floodwall",
            "opts": true,
            "cost": 250,
            "ground_tile": true,
            "structure_tile": true,
            "id": "flood_wall_mit",
            "opts_values": {
                1: {
                    "value": 1,
                    "text": "1 feets",
                    "cost": 150
                },
                2: {
                    "value": 2,
                    "text": "2 feets",
                    "cost": 250
                },
                3: {
                    "value": 3,
                    "text": "3 feets",
                    "cost": 350
                },
                4: {
                    "value": 4,
                    "text": "4 feets",
                    "cost": 450
                }

            },
        },
        "sand_bag": {
            "opts": true,
            "cost": 250,
            "ground_tile": true,
            "structure_tile": true,
            "id": "sand_bag_mit",
            "opts_values": {
                1: {
                    "value": 1,
                    "text": "1 feets",
                    "cost": 170
                },
                2: {
                    "value": 2,
                    "text": "2 feets",
                    "cost": 270
                },
                3: {
                    "value": 3,
                    "text": "3 feets",
                    "cost": 370
                }


            },
        },
        "insurance": {
            "opts": false,
            "cost": 250,
            "ground_tile": true,
            "structure_tile": true,
            "id": "insurance_mit",
        },
        "relocate_structure": {
            "opts": false,
            "cost": 250,
            "ground_tile": false,
            "structure_tile": true,
            "id": "relocate_structure_mit",
        },
        "remove_structure": {
            "opts": false,
            "cost": 250,
            "ground_tile": false,
            "structure_tile": true,
            "id": "remove_structure_mit",
        },
        "elevate_structure": {
            "opts": false,
            "cost": 250,
            "ground_tile": false,
            "structure_tile": true,
            "id": "elevate_structure_mit",
        }
    };

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

    [groundTiles, surfaceTiles, surfaceTiles_v2, floodTiles, pos_of_objects, countMap, floodData, minElevation, maxElevation] = createTiles();
    console.log("groundTiles and surfaceTiles objects are created!!!");
    [meshDict, meshDictIndex] = createMeshes(countMap);
    console.log("meshDict is created!!!");
    
    

    init();
    //onWindowResize();
    animate();

    console.log("Scene polycount:", renderer.info.render.triangles);
    console.log("Active Drawcalls:", renderer.info.render.calls);
    console.log("Textures in Memory", renderer.info.memory.textures);
    console.log("Geometries in Memory", renderer.info.memory.geometries);
    console.log("vertices currently renderered", renderer);

    function init() {

        CameraControls.install({ THREE: THREE });

        //Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xcce0ff);
        //scene.background = new THREE.Color( "#000000" );
        // Camera set up
        var frustumSize = 1000;
        var a = $(container).width();
        var b = $(container).height()
        var aspect = a / b;
        camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 10000);
        camera.position.set(0 * a, a, -2 * a);
        camera.lookAt(scene.position);
        scene.add(camera);
var planeGeometry = new THREE.PlaneGeometry(20000, 20000, 1, 1);
var texture = new THREE.TextureLoader().load( '../extras/staticmap_v3.png' );
var planeMaterial = new THREE.MeshLambertMaterial( { map: texture } );
//var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;
// rotate and position the plane
plane.rotation.x = -0.5 * Math.PI;
plane.position.set(0,0,0);
// add the plane to the scene
scene.add(plane);
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
        //cameraControls.mouseButtons.right = CameraControls.ACTION["NONE"];
        //cameraControls.mouseButtons.wheel = CameraControls.ACTION["NONE"];
        //cameraControls.verticalDragToForward = false;
        //cameraControls.truckSpeed = 8.0;
        cameraControls.zoom(0.25, false);
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
        //updateQuickFactsPanel();
        // Update Main Game Panel
        uncheckAllMitigationStatus();

        //countdown( "countdown", 1000, 0 );
        //updateBudgetPanel();
        //createBorderWireframe(50);

        window.addEventListener('resize', onWindowResize);

        renderer.domElement.addEventListener('mousemove', onMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onMouseClick, false);
        renderer.shadowMap.needsUpdate = true;
        updateGameProgressPanel();
        updateGoalsPanel();


    };


    function createWorld() {

        var x, z;

        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {

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

        for (var row = -10; row < 0; row++) {
            for (var column = -10; column < 110; column++) {

                //obj = groundTiles[row][column];

                transform.scale.set(tileSize, 100, tileSize);

                [x, z] = calculatePosition(row, column);

                transform.position.set(
                    x,
                    50,
                    z);
                transform.updateMatrix();

                meshDict["empty"].setMatrixAt(meshDictIndex["empty"][0]++, transform.matrix);
                //groundTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                //meshDict[obj.type].renderOrder = 0;
            };
        };

        for (var row = 100; row < 110; row++) {
            for (var column = -10; column < 110; column++) {

                //obj = groundTiles[row][column];

                transform.scale.set(tileSize, 100, tileSize);

                [x, z] = calculatePosition(row, column);

                transform.position.set(
                    x,
                    50,
                    z);
                transform.updateMatrix();

                meshDict["empty"].setMatrixAt(meshDictIndex["empty"][0]++, transform.matrix);
                //groundTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                //meshDict[obj.type].renderOrder = 0;
            };
        };

        for (var row = 0; row < 100; row++) {
            for (var column = 100; column < 110; column++) {

                //obj = groundTiles[row][column];

                transform.scale.set(tileSize, 100, tileSize);

                [x, z] = calculatePosition(row, column);

                transform.position.set(
                    x,
                    50,
                    z);
                transform.updateMatrix();

                meshDict["empty"].setMatrixAt(meshDictIndex["empty"][0]++, transform.matrix);
                //groundTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                //meshDict[obj.type].renderOrder = 0;
            };
        };

        for (var row = 0; row < 100; row++) {
            for (var column = -10; column < 0; column++) {

                //obj = groundTiles[row][column];

                transform.scale.set(tileSize, 100, tileSize);

                [x, z] = calculatePosition(row, column);

                transform.position.set(
                    x,
                    50,
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
                    transform.position.set(
                         x,
                        groundTiles[row][column].elevation,
                        z);
                    transform.updateMatrix();
                    meshDict[obj.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
                    surfaceTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                }
            }
        }

        for (var row = 0; row < numberOfRows; row++){
            for (var column = 0; column < numberOfColumns; column++){
                obj = surfaceTiles_v2[row][column];
                if (obj != 0){
                    [x, z] = calculatePosition(row, column);
                    if (obj.type == "tree"){
                        dictSurfacePositiontoInstancedId["tree"][
                            [row, column]] = [];
                        for (var i = 0; i < 10; i++){
                            if (Math.random > 0.5) {
                                var x1 = x + Math.random() * 40;
                                var z1 = z + Math.random() * 40;
                            } else {
                                var x1 = x - Math.random() * 40;
                                var z1 = z - Math.random() * 40;
                            };
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
                    }
                    else if (obj.type == "road_v"){
                        dictSurfacePositiontoInstancedId["road_h"][
                            [row, column]] = [];
                        transform.position.set(
                            x,
                            groundTiles[row][column].elevation + 1,
                            z - 25);
                        transform.updateMatrix();
                        meshDict["road_h"].setMatrixAt(meshDictIndex["road_h"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["road_h"][0] - 1);
                        dictInstancedIdtoSurfacePosition["road_h"][meshDictIndex["road_h"][0] - 1] = [row, column];
                        dictSurfacePositiontoInstancedId["road_h"][
                            [row, column]
                        ].push(meshDictIndex["road_h"][0] - 1);
                        transform.position.set(
                            x,
                            groundTiles[row][column].elevation + 1,
                            z + 25);
                        transform.updateMatrix();
                        meshDict["road_h"].setMatrixAt(meshDictIndex["road_h"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["road_h"][0] - 1);
                        dictInstancedIdtoSurfacePosition["road_h"][meshDictIndex["road_h"][0] - 1] = [row, column];
                        dictSurfacePositiontoInstancedId["road_h"][
                            [row, column]
                        ].push(meshDictIndex["road_h"][0] - 1);
                    }
                    else if (obj.type == "road_h"){
                        dictSurfacePositiontoInstancedId["road_v"][
                            [row, column]] = [];
                        transform.position.set(
                            x - 25,
                            groundTiles[row][column].elevation + 1,
                            z);
                        transform.updateMatrix();
                        meshDict["road_v"].setMatrixAt(meshDictIndex["road_v"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["road_v"][0] - 1);
                        dictInstancedIdtoSurfacePosition["road_v"][meshDictIndex["road_v"][0] - 1] = [row, column];
                        dictSurfacePositiontoInstancedId["road_v"][
                            [row, column]
                        ].push(meshDictIndex["road_v"][0] - 1);
                        transform.position.set(
                            x + 25,
                            groundTiles[row][column].elevation + 1,
                            z);
                        transform.updateMatrix();
                        meshDict["road_v"].setMatrixAt(meshDictIndex["road_v"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column]["instanceId"].push(meshDictIndex["road_v"][0] - 1);
                        dictInstancedIdtoSurfacePosition["road_v"][meshDictIndex["road_v"][0] - 1] = [row, column];
                        dictSurfacePositiontoInstancedId["road_v"][
                            [row, column]
                        ].push(meshDictIndex["road_v"][0] - 1);
                    }
                    else if (obj.type == "road_c"){
                        transform.position.set(
                            x,
                            groundTiles[row][column].elevation + 2,
                            z);
                        transform.updateMatrix();
                        meshDict["road_c"].setMatrixAt(meshDictIndex["road_c"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column].instanceId = meshDictIndex["road_c"][0] - 1;
                    }
                    else if (obj.type == "parking"){
                        transform.position.set(
                            x,
                            groundTiles[row][column].elevation + 2,
                            z);
                        transform.updateMatrix();

                        meshDict["parking"].setMatrixAt(meshDictIndex["parking"][0]++, transform.matrix);
                        surfaceTiles_v2[row][column].instanceId = meshDictIndex["parking"][0] - 1;
                    }
                    else{
                        transform.position.set(
                            x,
                            groundTiles[row][column].elevation + 2,
                            z);
                        transform.updateMatrix();

                        meshDict[ob.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
                        surfaceTiles_v2[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
                        
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



    function encode(s) {
        var out = [];
        for (var i = 0; i < s.length; i++) {
            out[i] = s.charCodeAt(i);
        }
        return new Uint8Array(out);
    };

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

    function updateBudgetPanel() {
        /*
            This function updates the budget information
            on the main menu. It contains information with
            total budget, expenses and remaining budget.

        */

        /* Total Budget */
        quick_fact_budget_panel[0].innerHTML = "$50000000"

        /* Expenses */
        quick_fact_budget_panel[1].innerHTML = "$" + (expenses).toFixed(0);

        /* Remaining Budget*/
        quick_fact_budget_panel[2].innerHTML = "$" + (totalAvailableMoney).toFixed(0);
    };


    function updateQuickFactsPanel() {
        /*
            This function updates the quick facts panel
            on the main menu. It contains information about
            total budget, expenses, remaining budget, # of secured
            people, # of mitigated areas and # of risky areas.

        */

        /* Total Budget */
        quick_fact_budget_panel[0].innerHTML = "$50000000"

        /* Expenses */
        quick_fact_budget_panel[1].innerHTML = "$" + (expenses).toFixed(0);

        /* Remaining Budget*/
        quick_fact_budget_panel[2].innerHTML = "$" + (totalAvailableMoney).toFixed(0);

        /* Number of secured people */
        quick_fact_info_panel[0].innerHTML = 0;

        /* Number of mitigated areas */
        quick_fact_info_panel[1].innerHTML = findNumberOfMitigatedRegions();

        /* Number of risky areas */
        quick_fact_info_panel[2].innerHTML = findNumberofRiskyAreas();

    };

/*
    function updateFloodInformation() {

        var tempFloodLevel;
        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
                obj = floodTiles[row][column];
                if (obj != 0) {
                    tempFloodLevel = floodTiles[row][column].flood_level - groundTiles[row][column].elevation - Math.max(
                        groundTiles[row][column].floodWall)
                    floodTiles[row][column].water_level = tempFloodLevel;
                }
            }
        }


    };
*/



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




    function updateFloodInformation(max_flood_level=74){
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





    function findNumberofRiskyAreas() {
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
                    if (tempFloodLevel > 0) { numberOfRiskyAreas += 1; }
                }
            }
        }
        return numberOfRiskyAreas;
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
    }

    function guiCostUpdate() {
        /*
            This function updates the cost values shown on
            the main panel when a different option is selected.
        
        */

        // Add Building
        allMitigationsSelects[0].onchange = function() {
            allMitigationsCostTexts[0].textContent = "$" + nFormatter(mitigationMetaData[
                "add_structure"]["opts_values"][(allMitigationsSelects[0].value)]["cost"], 2);
        };

        // Change Tile
        allMitigationsSelects[1].onchange = function() {
            allMitigationsCostTexts[1].textContent = "$" + nFormatter(mitigationMetaData[
                "change_tile"]["opts_values"][(allMitigationsSelects[1].value)]["cost"], 2);
        };

        // Flood Wall
        allMitigationsSelects[2].onchange = function() {
            //allMitigationsCostTexts[2].textContent = "$" + mitigationMetaData[
                //"flood_wall"]["opts_values"][parseInt(allMitigationsSelects[2].value)]["cost"];

            if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
                allMitigationsCostTexts[2].textContent = "$" + nFormatter(mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 2);
            }
            else{
                allMitigationsCostTexts[2].textContent = "$" + nFormatter(mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * 500, 2);
            };
        };

        //Sand Bag
        allMitigationsSelects[3].onchange = function() {
            //allMitigationsCostTexts[3].textContent = "$" + mitigationMetaData[
                //"sand_bag"]["opts_values"][parseInt(allMitigationsSelects[3].value)]["cost"];
            allMitigationsCostTexts[3].textContent = "$" + nFormatter(mitigationMetaDataNew["Sandbag"]["cost"][parseInt(allMitigationsSelects[3].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 2);
        };
        // Insurance

        // Relocate Structure

        // Remove Structure

        // Elevate Structure
        elevateStructureSlider[0].onchange = function(){
            allMitigationsCostTexts[7].textContent = "$" + nFormatter(mitigationMetaDataNew["ElevateStructure"]["cost"][parseInt(elevateStructureSlider[0].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Area"], 2);
        }
        // Wet Floodproofing
        allMitigationsSelects[4].onchange = function() {
            //allMitigationsCostTexts[3].textContent = "$" + mitigationMetaData[
                //"sand_bag"]["opts_values"][parseInt(allMitigationsSelects[3].value)]["cost"];
            allMitigationsCostTexts[8].textContent = "$" + nFormatter(mitigationMetaDataNew["Wetfloodproofing"]["cost"][parseInt(allMitigationsSelects[4].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 2);
        };

        // Dry Floodproofing
        allMitigationsSelects[5].onchange = function() {
            //allMitigationsCostTexts[3].textContent = "$" + mitigationMetaData[
                //"sand_bag"]["opts_values"][parseInt(allMitigationsSelects[3].value)]["cost"];
            allMitigationsCostTexts[9].textContent = "$" + nFormatter(mitigationMetaDataNew["Dryfloodproofing"]["cost"][parseInt(allMitigationsSelects[5].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 2);
        };


    }


    function guiCostUpdateForNonOptionMitigations(){
        /*
            It updates the cost value on mitigation panel
            when a new building tile is selected.

        */
        // Insurance
        allMitigationsCostTexts[4].textContent = "$" + nFormatter(mitigationMetaDataNew["Insurance"]["cost"][surfaceTiles[selectedTile.row][selectedTile.column].type] * (buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column].type]["Str_val"] + buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column].type]["Cont_val"]), 2);
        // Relocate Structure
        allMitigationsCostTexts[5].textContent = "$" + nFormatter(mitigationMetaDataNew["Relocate"]["cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column].type]["Area"], 2);
        // Remove Structure
    };

    function guiCostUpdateOnTileChanged(){
        /*
            This function updates cost values of mitigation
            options when a tile clicked.
        */

        // Add Structure
        allMitigationsCostTexts[0].textContent = "$" + nFormatter(mitigationMetaData[
            "add_structure"]["opts_values"][(allMitigationsSelects[0].value)]["cost"], 2);

        // FloodWall
        if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[2].textContent = "$" + nFormatter(mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 2);
        }
        else{
            allMitigationsCostTexts[2].textContent = "$" + nFormatter(mitigationMetaDataNew["Floodwall"]["cost"][parseInt(allMitigationsSelects[2].value)]["Cost"] * 500, 2);
        }
        // SandBag
         if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[3].textContent = "$" + nFormatter(mitigationMetaDataNew["Sandbag"]["cost"][parseInt(allMitigationsSelects[3].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 2);
         }
        
         // Elevate Structure
         if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[7].textContent = "$" + nFormatter(mitigationMetaDataNew["ElevateStructure"]["cost"][parseInt(elevateStructureSlider[0].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Area"], 2);
         }

        // Wet Floodproofing
        if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[8].textContent = "$" + nFormatter(mitigationMetaDataNew["Wetfloodproofing"]["cost"][parseInt(allMitigationsSelects[4].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 2);
         }
        // Dry Floodproofing
        if (surfaceTiles[selectedTile.row][selectedTile.column] != 0){
            allMitigationsCostTexts[9].textContent = "$" + nFormatter(mitigationMetaDataNew["Dryfloodproofing"]["cost"][parseInt(allMitigationsSelects[5].value)]["Cost"] * buildingMetaDict[surfaceTiles[selectedTile.row][selectedTile.column]["type"]]["Perimeter"], 2);
         }
    };


    function updateGameProgressPanel(){
        /*
            This function updates the Game Progress Panel on Main Page.
        */

        var gameProgressPanel = document.querySelectorAll("#critical-facts .has-text-right");

        // -- Remaining Budget --
        gameProgressPanel[0].textContent = "$" + nFormatter((totalAvailableMoney).toFixed(0), 2) + "/" + nFormatter(50000000, 2);

        // -- Vulnerable Population --
        gameProgressPanel[1].textContent =  findNumberofEffectedPeople()[1] + "/" + findNumberofEffectedPeople()[0];

        // -- Avoided Loss --
        gameProgressPanel[2].textContent = "$" + nFormatter((totalCostAtTheStart - calculateTotalDamage()), 2);

        // -- Secured Building --
        gameProgressPanel[3].textContent = initialEffectedBuilding - findNumberOfEffectedBuilding()[1] + "/" + initialEffectedBuilding;

        // -- Shelter Capacity --
        gameProgressPanel[4].textContent = 0;

        // -- Secured Critical Buildings --
        gameProgressPanel[5].textContent = "0 / 0" 

    }

    function updateGoalsPanel(){
        /*
            This function updates the Goals  Panel on Main Page.
        */
        var goalPanel = document.querySelectorAll("#goals .has-text-right");

        
        // -- Secure Critical Buildings --
        goalPanel[0].textContent = "0 / 0";
        goalPanel[0].style.color = "red";

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
            This function updates the Game Progress Report.
        */

        var gameProgressMenu = document.querySelectorAll("#exampleModal .card_");

        // --Critical Facts--
        var factsLeftValues = gameProgressMenu[0].querySelectorAll(".card-content-left .card-content-item-val");
        var factsRightValues = gameProgressMenu[0].querySelectorAll(".card-content-right .card-content-item-val");

        // Secured Area
        factsLeftValues[0].textContent = initialEffectedBuilding - findNumberOfEffectedBuilding()[1] + "/" + initialEffectedBuilding;

        // Secured Building
        factsLeftValues[1].textContent = initialEffectedCriticalBuilding - findCriticalBuildingInformations()[1] + "/" + findCriticalBuildingInformations()[0];

        // Secured People
        factsLeftValues[2].textContent = "$" + (totalCostAtTheStart - calculateTotalDamage());

        // Secured Money
        //factsLeftValues[3].textContent = calculateInsurancedMoney();

        // Affected Area
        factsRightValues[0].textContent = "$" + (totalAvailableMoney).toFixed(0);

        // Affected Building
        factsRightValues[1].textContent = findNumberOfEffectedBuilding()[1];

        // Affected People
        factsRightValues[2].textContent =  findNumberofEffectedPeople()[1] + "/" + findNumberofEffectedPeople()[0];

        // Total Damage
        //factsRightValues[3].textContent = calculateTotalDamage();


        // --Goals--


        // --Summary--
        var summaryLeftValues = gameProgressMenu[2].querySelectorAll(".card-content-left .card-content-item-val");
        var summaryRightValues = gameProgressMenu[2].querySelectorAll(".card-content-right .card-content-item-val");
        // Remaining Budget
        summaryLeftValues[0].textContent = "$" + (totalAvailableMoney).toFixed(0);
        // Total Expenses
        summaryLeftValues[1].textContent = "$" + (expenses).toFixed(0);
        // Applied Mitigation
        summaryRightValues[0].textContent = findNumberOfMitigatedRegions();
        // Sheltered Population
        summaryRightValues[1].textContent = findNumberOfShelteredPeople();

    };

/*
    function calculateTotalDamage() {

        var totalBuildingDamage = 0
        var totalAreaDamage = 0;

        for (var row = 0; row < numberOfRows; row++) {
            for (var column = 0; column < numberOfColumns; column++) {
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
    */

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
        //console.log(calculateTotalDamage());
        //console.log(calculateInsurancedMoney());
        //console.log(findNumberofEffectedPeople());
        //console.log(findNumberOfEffectedBuilding());
    };





    function isABuilding(type){
        if (["Res1", "Res2", "Res3", "Com", "Ind", "Hos", "Fire", "Pol", "School"].includes(type)){ return true; }
        else { return false; };
    };


    function isACriticalBuilding(type){
        if (["Com", "Ind", "Hos", "Fire", "Pol", "School"].includes(type)){ return true; }
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
                    //wireframe_4.position.set(pos_x, findElevation(row, column) + 4, pos_z);
                    wireframe_4.geometry.setPositions(borderPosition(row, column, findElevation(0, 0) + 2, 50).flat(1));
                    wireframe_4.visible = true;
                    wireframe_4.updateMatrix();
                    wireframe_1.visible = false;
                    //wireframe_1.updateMatrix();

                } else {
                    //wireframe_1.position.set(pos_x, findElevation(row, column) + 4, pos_z);
                    wireframe_1.geometry.setPositions(borderPosition(row, column, findElevation(0, 0) + 2, 50).flat(1));
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



    function onMouseClick(event) {


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
                        // wireframe_1.updateMatrix();

                        wireframe_4.visible = false;
                        // wireframe_1.updateMatrix();

                        if (!selectedTile.isSelected) {
                            console.log("Tile is clicked and Selected");
                            showEmptyTileGUI(true);
                            showBuildingTileGUI(true);
                            fillSelectedTile(row, column, event);

                        } else {

                            if (selectedTile.row == row && selectedTile.column == column) {
                                console.log("Same Tile is clicked and SelectedTile is cleared")
                                showEmptyTileGUI(false);
                                showBuildingTileGUI(false);
                                clearSelectedTile();

                            } else if (selectedBuilding.isMove) {
                                console.log("As a result of relocate sturucture mitigation option, Building's position is changed.")
                                changePositionBuilding(row, column);

                            } else {
                                console.log("New Tile is Selected")
                                clearSelectedTile();
                                showEmptyTileGUI(true);
                                showBuildingTileGUI(true);
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

                        };
                    };
                };
        };
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

        if (meshName == "road_v" || meshName == "tree" || meshName == "road_h") {
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

    function getRandomArbitrary(min = 10, max = 120) {

        return Math.random() * (max - min) + min;

    };


    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
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
            if (surfaceTiles_v2[row][column].type != "tree"){
                console.log("Not tree")
                showEmptyTileGUI(false);
                showMitigationOption(mitigationMetaData["flood_wall"]["id"]);
            };
        };


        if (hasMitigation(row, column)) {
            moveWireFrame_3(1, row, column);
            wireframe_2.visible = false
        } else {
            wireframe_3.visible = false;
            moveWireFrame_2(1, row, column);
        };
        updateTileOptions(row, column);
        updateTileInformationPanel();
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
                if (surfaceTiles_v2[row][column].type != "tree"){
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

        console.log(temp_mit_id)
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
            console.log("checkk dry")
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
        moveWireFrame_2(2, 0, 0);
        moveWireFrame_3(2, 0, 0);

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
        if (type == 1) { wireframe_2.visible = true; } else { wireframe_2.visible = false; };

        wireframe_2.updateMatrix();

    };

    function moveWireFrame_3(type, row, column) {

        var [pos_x, pos_z] = [selectedTile.pos_x, selectedTile.pos_z];
        var floodHeight = 0;

        if (isFlood) {
            floodHeight = floodTiles[row][column].height;
        };
        /*
        wireframe_3.position.set(
            selectedTile.pos_x,
            groundTiles[row][column].elevation + floodHeight + 4,
            selectedTile.pos_z);
            */
        wireframe_3.geometry.setPositions(
            borderPosition(row, column, findElevation(row, column) + 2, 50).flat(1));
        if (type == 1) { wireframe_3.visible = true; } else { wireframe_3.visible = false; };

        wireframe_3.updateMatrix();

    };


    function changePositionBuilding(row, column) {

        if (["water", "parking_lot", "road", "building"].includes(groundTiles[row][column].type)) {
            alert("Destination should be empty tile!!!");
            clearSelectedTile();
            return
        };

        
        clearTileForBuilding(row, column);
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
        clearTileForBuilding(selectedBuilding.row, selectedBuilding.column);
        createPark(selectedBuilding.row, selectedBuilding.column);

        clearSelectedTile();
        fillSelectedTile(row, column);

        expenses += mitigationMetaData["relocate_structure"]["cost"];
        totalAvailableMoney -= mitigationMetaData["relocate_structure"]["cost"];
        //updateQuickFactsPanel();
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
            


        } else if (type == "road") {
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



        } else {
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
}
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
                console.log("Tile is not parking lot or park")
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
        for (var i = 0; i < 10; i++){
            if (Math.random > 0.5) {
                var x1 = x + Math.random() * 40;
                var z1 = z + Math.random() * 40;
            } else {
                var x1 = x - Math.random() * 40;
                var z1 = z - Math.random() * 40;
            };
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

        } else {

            meshDict[selectedBuilding.meshName].setMatrixAt(selectedBuilding.instanceId, transform.matrix);
            meshDictIndex[selectedBuilding.meshName][1].push(selectedBuilding.instanceId);
            createPark(selectedBuilding.row, selectedBuilding.column);
        };
        meshDict[selectedBuilding.meshName].instanceMatrix.needsUpdate = true;
        surfaceTiles[selectedBuilding.row][selectedBuilding.column] = 0;
    };

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

    function changeColorOfRiskyRegions() {

        var positions_of_regions = findRiskyAreas();
        var newColor1 = [1, 0, 0];

        for (var i = 0; i < positions_of_regions.length; i++) {

            var [row1, column1] = positions_of_regions[i];
            updateBorderColor(row1, column1, newColor1);
            //updateBorderColor(row1, column1, [getRandomInt(2), getRandomInt(2), getRandomInt(2)]);
        };
    };

    function clearColorOfRiskyRegions() {

        //var positions_of_regions = findRiskyAreas();
        var newColor1 = [0, 0, 0];
        /*
        for (var i = 0; i < positions_of_regions.length; i++) {

            var [row1, column1] = positions_of_regions[i];
            updateBorderColor(row1, column1, newColor1);
        };
        */
        for (var i = 0; i < numberOfRows; i++){
            for (var j = 0; j < numberOfColumns; j++){
                updateBorderColor(i, j, newColor1);
            }
        }
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
            [0, 0, 0],
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
    };


    function findNumberOfShelteredPeople() {
        /*
            This function finds number of sheltered people
            on the system.
        */
        return 0;
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


    function minMax(value, minElevationn = minElevation, maxElevationn = maxElevation, min = 10, max = 150) {
        var normalizedValue;

        normalizedValue = Math.floor(((value - minElevationn) / (maxElevationn - minElevationn)) * (max - min) + min + Math.random() * 2);
        //normalizedValue = value;
        return normalizedValue;
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


    function addStructureCost(structure) {

        if (structure == "Res1") {
            return 100;
        } else if (structure == "Res2") {
            return 125;
        } else if (structure == "Res3") {
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
            //updateQuickFactsPanel();
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
            //updateQuickFactsPanel();
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
                //updateQuickFactsPanel();
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
                //updateQuickFactsPanel();
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
                    //updateQuickFactsPanel();
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
                    //updateQuickFactsPanel();
                    updateGameProgressPanel();
                    updateGoalsPanel();
                    // Update Quick Facts Panel
                    //updateQuickFactsPanel();
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
                //updateQuickFactsPanel();
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
                //updateQuickFactsPanel();
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
            //updateQuickFactsPanel();
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

                    //updateQuickFactsPanel();
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

                    //updateQuickFactsPanel();
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
                    //updateQuickFactsPanel();
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
                    //updateQuickFactsPanel();
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
                    //updateQuickFactsPanel();
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
                    //updateQuickFactsPanel();
                    updateGameProgressPanel();
                    updateGoalsPanel();

                    // Update Main Game Panel
                    updateTileOptions(selectedTile.row, selectedTile.column);
                    updateTileInformationPanel();
                }
            }
            updateFloodInformation();

        };
        
    }



    function helperForFeetToIndex(number) {
        // It gives selected index according to sandbag and floodwall

        if (number == 3) { return 0; } else if (number == 5) { return 1; } else { return 2; };
    };


    function helperForChangeTile(typeTile) {

        if (typeTile == "w1" || typeTile == "g1" || typeTile == "c1") {
            return true
        } else { return false };
    }


    function helperForChangeTile2(typeTile) {
        if (typeTile == "w1") {
            return [0, 1, 2]
        } else if (typeTile == "c1") {
            return [1, 0, 2]
        } else if (typeTile == "g1") {
            return [2, 0, 1]
        } else {
            return [0, 1, 2]
        };
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
                            h = Math.round(obj.water_level);
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
                //changeColorOfRiskyRegions();
                changeColorofRiskyAreas();
                this.innerHTML = "Clear Risky Areas";
                this.value = false;
            } else {
                clearColorOfRiskyRegions();
                this.innerHTML = "Show Risks";
                this.value = true;
            };
        };
        // Show Mitigated Areas Button
        // controlSection[2].onclick = function() {

        //     if (this.value == "true") {
        //         changeColorOfMitigatedRegions();
        //         downloadCurrentDocument(groundTiles, "groundTiles");
        //         downloadCurrentDocument(surfaceTiles, "surfaceTiles");
        //         this.innerHTML = "Clear Mitigated Areas";
        //         this.value = false;
        //     } else {
        //         clearColorOfMitigatedRegions();
        //         this.innerHTML = "Mitigated Areas";
        //         this.value = true;
        //     }
        // };
        // Show Progress Button
        controlSection[3].onclick = function() {
            updateGameProgressReport();
            console.log(controlSection);
        };
    };

};

main();