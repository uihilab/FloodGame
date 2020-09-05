import {createTiles} from "./createWorldData.js";
import {createMeshes} from "./loadModels_5side.js";
import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import { GUI } from './../libs/three.js-dev/examples/jsm/libs/dat.gui.module.js';
import Stats from './../libs/three.js-dev/examples/jsm/libs/stats.module.js';
import CameraControls from "./../libs/camera-controls/dist/camera-controls.module.js"
import * as holdEvent from "./../libs/camera-controls/dist/hold-event.module.js";

function main(){

	var camera, scene, renderer, stats, gui;

	var cameraControls;
	const clock = new THREE.Clock();

	var groundTiles, surfaceTiles, pos_of_objects;

	var meshDict, meshDictIndex, floodMesh;

	var obj;

	var tileSize = 100;
	var numberOfTiles = 10000;
	var numberOfTiles_X = Math.pow(numberOfTiles, 0.5)
	var side_length = numberOfTiles_X * tileSize;

	var transform = new THREE.Object3D();
	var instanceMatrix = new THREE.Matrix4();
	var matrix = new THREE.Matrix4();
	var vector3Scale = new THREE.Vector3(1, 1, 1);
	var vector3Position = new THREE.Vector3(1, 1, 1);

	var dest_vector3Scale = new THREE.Vector3(1, 1, 1);
	var dest_vector3Position = new THREE.Vector3(1, 1, 1);
	var dest_instanceMatrix = new THREE.Matrix4();

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2( 1, 1 );
	var wireframe_1, wireframe_2;


	var v1 = new THREE.Vector3(-6200, 0, -2525);
	var v2 = new THREE.Vector3( 6050, 0, 2525);
	var bb = new THREE.Box3(v1, v2);


	var tileElevation; //??

	var tileFolder, buildingFolder, tileActions, buildingActions;
	var zoom = 2;


	var elevationhelper = {
		"row": 0,
		"column": 0,
		"elevation":0
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



	[groundTiles, surfaceTiles, pos_of_objects] = createTiles();
	console.log("groundTiles and surfaceTiles objects are created!!!");
	[meshDict, meshDictIndex] = createMeshes();
	console.log("meshDict is created!!!");

	init();
	onWindowResize();
	animate();

	console.log("Scene polycount:", renderer.info.render.triangles);
	console.log("Active Drawcalls:", renderer.info.render.calls);
	console.log("Textures in Memory", renderer.info.memory.textures);
	console.log("Geometries in Memory", renderer.info.memory.geometries);

	function init(){

		CameraControls.install( { THREE: THREE } );

		//Scene
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xcce0ff);

		// Camera set up
		var frustumSize = 1000;
		var aspect = window.innerWidth / window.innerHeight;
		camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 10000 );
		camera.position.set(2 * window.innerWidth, 1.5 * window.innerWidth, 0 * window.innerWidth);
		camera.lookAt(scene.position);
		scene.add(camera);

		// Lights
		var light = new THREE.AmbientLight(0xFFFFFF, 0.8);
		scene.add(light);

		var spotLight = new THREE.SpotLight(0xffffff, 2);
		spotLight.position.set(8000, 1000, 5000);
		spotLight.castShadow = true;
		spotLight.receiveShadow = true;
		spotLight.distance = 10000
		spotLight.angle = Math.PI / 4
		scene.add(spotLight);

		// renderer
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.shadowMap.autoUpdate = false;
		var container = document.getElementById("webgl-output");
		container.appendChild(renderer.domElement);

		createWorld();
		createWireframes();

		cameraControls = new CameraControls(camera, renderer.domElement);
		cameraControls.setBoundary( bb );
		cameraControls.mouseButtons.left = CameraControls.ACTION[ "NONE" ];
		cameraControls.mouseButtons.wheel = CameraControls.ACTION[ "NONE" ];
		//cameraControls.truckSpeed = 8.0;

		stats = new Stats();
		document.body.appendChild( stats.domElement );

		gui = new GUI();
		createControlGUI();
		emptyTileGUI();
		buildingGUI();
		cameraMovement();

		renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );
		renderer.domElement.addEventListener( 'mousedown', onMouseClick, false );
		renderer.shadowMap.needsUpdate = true;

	};


	function createWorld(){

		var x, z;

		for (var row = 0; row < numberOfTiles_X; row++){
			for (var column = 0; column < numberOfTiles_X; column++){

				obj = groundTiles[row][column];

				transform.rotation.x = 0;
				transform.rotation.y = 0;
				transform.rotation.z = 0;
				transform.rotateY(-45 * THREE.Math.DEG2RAD);
				
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

		
		for (let i of pos_of_objects){

			[row, column] = [i[0], i[1]];
			obj = surfaceTiles[row][column];
			
			transform.rotation.x = 0;
			transform.rotation.y = 0;
			transform.rotation.z = 0;
			transform.rotateY(-45 * THREE.Math.DEG2RAD);			

			transform.scale.set(
				tileSize * obj.size / 10,
				obj.height,
				tileSize * obj.size / 10);
			
			[x, z] = calculatePosition(obj.row, obj.column);
			
			transform.position.set(
				x,
				obj.elevation + obj.height / 2,
				z);
			transform.updateMatrix();

			meshDict[obj.type].setMatrixAt(meshDictIndex[obj.type][0]++, transform.matrix);
			surfaceTiles[row][column].instanceId = meshDictIndex[obj.type][0] - 1;
			//meshDict[obj.type].renderOrder = 0;
		};

		for (name of Object.keys(meshDict)){
			scene.add(meshDict[name]);
		};



	};


	function createWireframes(){

		var helpGeo = new THREE.BoxBufferGeometry( 98, 98);
		helpGeo.rotateX(-Math.PI * 0.5)
		helpGeo.rotateY(-45 * THREE.Math.DEG2RAD);

		var wireframegeo = new THREE.EdgesGeometry( helpGeo );
		var wireframemat = new THREE.LineBasicMaterial( { color: 0x99cc99, linewidth: 4 } );
		wireframe_1 = new THREE.LineSegments( wireframegeo, wireframemat );
		wireframe_1.name = "wireframe_1";
		wireframe_1.visible = false;
		wireframe_1.transparent = true;
		scene.add(wireframe_1);

		var wireframemat_2 = new THREE.LineBasicMaterial( { color: 0xcccccc, linewidth: 4 } );
		wireframe_2 = new THREE.LineSegments( wireframegeo, wireframemat_2 );
		wireframe_2.name = "wireframe_2";
		wireframe_2.visible = false;
		//wireframe_2.renderOrder = 10;
		scene.add(wireframe_2);

	};


	function createControlGUI(){

		var gameControl = new function(){

			this.rotate = function(){

				cameraControls.rotate( -90 * THREE.Math.DEG2RAD, 0, true );

			};

			this.zoomIn = function(){

				zoom /= 2;

				if (zoom == 1){

					v1 = new THREE.Vector3(-6450, 0, -2725);
					v2 = new THREE.Vector3( 6300, 0, 2725);
					bb = new THREE.Box3(v1, v2);

					cameraControls.setBoundary(bb);
					cameraControls.zoom(0.25, true);

				}
				else if (zoom == 2){

					v1 = new THREE.Vector3(-6200, 0, -2525);
					v2 = new THREE.Vector3( 6050, 0, 2525);
					bb = new THREE.Box3(v1, v2);

					cameraControls.setBoundary(bb);
					cameraControls.zoom(0.25, true);
				}
				else if (zoom == 4){

					v1 = new THREE.Vector3(-6050, 0, -2225);
					v2 = new THREE.Vector3( 5850, 0, 2225);
					bb = new THREE.Box3(v1, v2);

					cameraControls.setBoundary(bb);
					cameraControls.zoom(0.2, true);

				}
				else if (zoom == 8){

					v1 = new THREE.Vector3(-5600, 0, -1800);
					v2 = new THREE.Vector3( 5400, 0, 1800);
					bb = new THREE.Box3(v1, v2);

					cameraControls.setBoundary(bb);
					cameraControls.zoom(0.15, true);

				}
				else {

					zoom *= 2;

				};

				//cameraControls.zoom( camera.zoom / 2, true );
			};

			this.zoomOut = function(){

				zoom *= 2;

				if (zoom == 2){

					v1 = new THREE.Vector3(-6200, 0, -2525);
					v2 = new THREE.Vector3( 6050, 0, 2525);
					bb = new THREE.Box3(v1, v2);

					cameraControls.setBoundary(bb);
					cameraControls.zoom(-0.25, true);

				}
				else if (zoom == 4){

					v1 = new THREE.Vector3(-6050, 0, -2225);
					v2 = new THREE.Vector3( 5850, 0, 2225);
					bb = new THREE.Box3(v1, v2);

					cameraControls.setBoundary(bb);
					cameraControls.zoom(-0.25, true);

				}
				else if (zoom == 8){

					v1 = new THREE.Vector3(-5600, 0, -1800);
					v2 = new THREE.Vector3( 5400, 0, 1800);
					bb = new THREE.Box3(v1, v2);

					cameraControls.setBoundary(bb);
					cameraControls.zoom(-0.2, true);
				}
				else if (zoom == 16){

					v1 = new THREE.Vector3(-5150, 0, -1200);
					v2 = new THREE.Vector3( 4875, 0, 1150);
					bb = new THREE.Box3(v1, v2);

					cameraControls.setBoundary(bb);
					cameraControls.zoom(-0.15, true);
				}
				else{
					zoom /= 2;
				};

			};

			this.reset = function(){

				zoom = 2;
				cameraControls.reset();

			};

		};

		gui.add(gameControl, "rotate");
		gui.add(gameControl, "zoomIn");
		gui.add(gameControl, "zoomOut");
		gui.add(gameControl, "reset");

	};


	function buildingGUI(){

		buildingFolder = gui.addFolder("Building Options");

		buildingActions = new function(){

			this.tileElevation = selectedTile.elevation;

			this.removeBuilding = function(){

				deleteBuilding();
				clearSelectedTile();

			};

			this.move = function(){

				selectedBuilding.isMove = true;

			};

			this.changeElevation = function(){
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


	function emptyTileGUI(){

		tileFolder = gui.addFolder("Tile Options");

		tileActions = new function(){

			this.tileElevation = selectedTile.elevation;
			this.addBuilding = "";
			this.type = "";
			this.addBuildingAction = function(){

				createBuilding(
					tileActions.addBuilding,
					selectedTile.row,
					selectedTile.column);
				clearSelectedTile();
				tileActions.addBuilding = "";
			};

			this.changeType = function(){

				changeTileType(
					tileActions.type,
					selectedTile.row,
					selectedTile.column
				);
				clearSelectedTile();
				tileActions.type = "";

			};

			this.changeElevation = function(){
				changeElevation(
					selectedTile.row,
					selectedTile.column,
					tileActions.tileElevation);

			};
		};

		tileFolder.add(tileActions, "addBuilding", ["b1", "b2", "b3", "s1"]).onChange(tileActions.addBuildingAction).listen().name("Building Construct");
		tileFolder.add(tileActions, "type", ["w1", "c1", "g1"]).onChange(tileActions.changeType).listen().name("Change Tile Type");
		tileFolder.add(tileActions, "tileElevation", 40, 300).onChange(tileActions.changeElevation).listen().name("Tile Elevation");
		tileFolder.hide();

	};


	function cameraMovement(){

		var KEYCODE = {
			W: 87,
			A: 65,
			S: 83,
			D: 68,
			ARROW_LEFT : 37,
			ARROW_UP   : 38,
			ARROW_RIGHT: 39,
			ARROW_DOWN : 40,
		};

		var upKey = new holdEvent.KeyboardKeyHold( KEYCODE.ARROW_UP, 100 );
		var leftKey = new holdEvent.KeyboardKeyHold( KEYCODE.ARROW_LEFT, 100 );
		var downKey = new holdEvent.KeyboardKeyHold( KEYCODE.ARROW_DOWN, 100 );
		var rightKey = new holdEvent.KeyboardKeyHold( KEYCODE.ARROW_RIGHT, 100 );

		leftKey.addEventListener( 'holding', function( event ) { cameraControls.truck( -1 * event.deltaTime, 0, true ) } );
		rightKey.addEventListener( 'holding', function( event ) { cameraControls.truck(   1 * event.deltaTime, 0, true ) } );
		upKey.addEventListener( 'holding', function( event ) { cameraControls.forward(   1 * event.deltaTime, true ) } );
		downKey.addEventListener( 'holding', function( event ) { cameraControls.forward( - 1 * event.deltaTime, true ) } );

	};


	function onWindowResize() {

	};


	function animate() {

		const delta = clock.getDelta();
		const elapsed = clock.getElapsedTime();
		const updated = cameraControls.update( delta );
		requestAnimationFrame( animate );
		render();
		stats.update();

	};

	
	function render() {

		renderer.render( scene, camera );

	};


	function onMouseMove(event){

		event.preventDefault();

		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		raycaster.setFromCamera( mouse, camera );
		var intersection = raycaster.intersectObjects( scene.children );

		if (intersection.length > 0){
			if (!isWireFrame(intersection[0].object.name)){

				var meshName = intersection[0].object.name;
				var instanceId = intersection[0].instanceId;

				var [row, column, size] = findPosition(instanceId, meshName);
				var [pos_x, pos_z] = calculatePosition(row, column);

				wireframe_1.position.set(pos_x, findElevation(row, column) + 4, pos_z);
				wireframe_1.visible = true;
				wireframe_1.updateMatrix();
			}


		};


	};


	function isWireFrame(name){

		if (name == "wireframe_1" || name == "wireframe_2"){
			return true;
		};

		return false;
	};


	function onMouseClick(event){

		event.preventDefault();

		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		raycaster.setFromCamera( mouse, camera );
		var intersection = raycaster.intersectObjects( scene.children );
		switch( event.button ){
			case 0: //left
			if (intersection.length > 0){
				if (!isWireFrame(intersection[0].object.name)){

					var meshName = intersection[0].object.name;
					var instanceId = intersection[0].instanceId;

					var [row, column, size] = findPosition(instanceId, meshName);
					wireframe_1.visible = false;
					wireframe_1.updateMatrix();

					if (!selectedTile.isSelected){

						fillSelectedTile(row, column);

					}
					else {

						if (selectedTile.row == row && selectedTile.column == column){

							clearSelectedTile();

						}
						else if (selectedBuilding.isMove){

							changePositionBuilding(row, column);

						}
						else {

							clearSelectedTile();
							fillSelectedTile(row, column);

						};
					};
				};
			};
		};
	};


	function calculatePosition(row, column, tileSize=100, offset_x=7000, offset_z=3500){

		var m, n, pos_x, pos_z;

		m = row % 2;
		n = Math.floor(row / 2);

		pos_z = n * tileSize * Math.sqrt(2) + m * tileSize * Math.sqrt(2) * 0.5 - offset_z;
		pos_x = column * tileSize * Math.sqrt(2) + m * tileSize * Math.sqrt(2) * 0.5 - offset_x;

		return [pos_x, pos_z];
	
	};



	function calculateArrayPosition(pos_x, pos_z, tileSize=100, offset_x=7000, offset_z=3500){

		var m, n, row, column, pos_xx, pos_zz;

		pos_xx = pos_x + offset_x;
		pos_zz = pos_z + offset_z;
		pos_xx /= tileSize;
		pos_zz /= tileSize;

		pos_xx /= Math.sqrt(2);
		pos_zz /= Math.sqrt(2);

		if ((2 * pos_xx - 1) % 2 == 0){m = 1;}
		else{ m = 0;};

		column = pos_xx - m / 2;
		n = pos_zz - m / 2;
		row = Math.ceil(n * 2) + m;

		row = Math.ceil(row);
		column = Math.ceil(column);

		for (var i = 0; i < 2; i++){
			for (var j = 0; j < 2; j++){
				[pos_xx, pos_zz] = calculatePosition(row - i, column - j);
				if (Math.round(pos_xx) == Math.round(pos_x) && Math.round(pos_zz) == Math.round(pos_z)){
					return [row - i, column - j];
				};
			};
		};

		return [row, column];

	};


	function findPosition(instanceId, meshName){

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


	function findSize(scaleValue=100){
		var s;
		s = scaleValue / tileSize;
		return s;
	};


	function findElevation(row, column){

		return groundTiles[row][column].elevation;

	};
	
	function getRandomArbitrary(min=10, max=120){

		return Math.random() * (max - min) + min;

	};

	function fillSelectedTile(row, column){

		selectedTile.isSelected = true;
		selectedTile.instanceId = groundTiles[row][column].instanceId;
		selectedTile.meshName = groundTiles[row][column].type;
		selectedTile.row = row;
		selectedTile.column = column;
		[selectedTile.pos_x, selectedTile.pos_z] = calculatePosition(
			row, column);
		selectedTile.elevation = groundTiles[row][column].elevation;

		tileFolder.open();
		tileFolder.show();
		buildingFolder.hide();
		buildingFolder.close();

		tileActions.tileElevation = selectedTile.elevation;

		if (surfaceTiles[row][column]){
			fillSelectedBuilding(row, column);
		};

		moveWireFrame_2(1, row, column);
	};


	function clearSelectedTile(){

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

	};


	function fillSelectedBuilding(row, column){

		selectedBuilding.isSelected = true;
		selectedBuilding.meshName = surfaceTiles[row][column].type;
		selectedBuilding.instanceId = surfaceTiles[row][column].instanceId;
		selectedBuilding.row = row;
		selectedBuilding.column = column;
		[selectedBuilding.pos_x, selectedBuilding.pos_z] = calculatePosition(
			row, column);
		selectedBuilding.height = surfaceTiles[row][column].height;
		selectedBuilding.size = surfaceTiles[row][column].size;
		buildingFolder.show();
		buildingFolder.open();
		tileFolder.hide();
		tileFolder.close();

		buildingActions.tileElevation = selectedTile.elevation;

	};


	function clearSelectedBuilding(){

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


	function moveWireFrame_2 (type, row, column){

		var [pos_x, pos_z] = [selectedTile.pos_x, selectedTile.pos_z];
		wireframe_2.position.set(
			selectedTile.pos_x,
			groundTiles[row][column].elevation + 4,
			selectedTile.pos_z);
		if (type == 1){ wireframe_2.visible = true;}
		else{ wireframe_2.visible = false;};

		wireframe_2.updateMatrix();

	};


	function changePositionBuilding(row, column){

		if (surfaceTiles[row][column]){
			alert("Destination should be empty tile!!!");
			return
		};


		obj = surfaceTiles[selectedBuilding.row][selectedBuilding.column];

		transform.rotation.x = 0;
		transform.rotation.y = 0;
		transform.rotation.z = 0;
		transform.rotateY(-45 * THREE.Math.DEG2RAD);

		transform.scale.set(
			tileSize * obj.size / 10,
			obj.height,
			tileSize * obj.size / 10
		);

		var [x, z] = calculatePosition(row, column);

		transform.position.set(
			x,
			groundTiles[row][column].elevation + obj.height / 2,
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
	};


	function createBuilding(type, row, column, height=100, size=6){

		var [x, z] = calculatePosition(row, column);

		transform.rotation.x = 0;
		transform.rotation.y = 0;
		transform.rotation.z = 0;
		transform.rotateY(-45 * THREE.Math.DEG2RAD);

		transform.scale.set(
			tileSize * size / 10,
			height,
			tileSize * size / 10);

		transform.position.set(
			x,
			groundTiles[row][column].elevation + height / 2,
			z);
		transform.updateMatrix();

		meshDict[type].setMatrixAt(meshDictIndex[type][0]++, transform.matrix);
		meshDict[type].instanceMatrix.needsUpdate = true;

		surfaceTiles[row][column] = createSurfaceObject(
			type, row, column, height, groundTiles[row][column], meshDictIndex[type][0] - 1)

	};


	function createSurfaceObject(
		type, row, column, height, elevation, instanceId, size=6){

		var tempTile = {};
		tempTile.row = row;
		tempTile.column = column;
		tempTile.elevation = elevation;
		tempTile.height = height;
		tempTile.size = size;
		tempTile.type = type;
		tempTile.instanceId = instanceId;
		return tempTile;

	};


	function changeElevation(row, column, elevation){

		groundTiles[row][column].elevation = elevation;
		

		var [x, z] = calculatePosition(row, column);

		transform.rotation.x = 0;
		transform.rotation.y = 0;
		transform.rotation.z = 0;
		transform.rotateY(-45 * THREE.Math.DEG2RAD);

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

		moveWireFrame_2(1, row, column);

		if (surfaceTiles[row][column]){

			surfaceTiles[row][column].elevation = elevation;

			transform.rotation.x = 0;
			transform.rotation.y = 0;
			transform.rotation.z = 0;
			transform.rotateY(-45 * THREE.Math.DEG2RAD);

			transform.scale.set(
				tileSize * surfaceTiles[row][column].size / 10,
				surfaceTiles[row][column].height,
				tileSize * surfaceTiles[row][column].size / 10);

			transform.position.set(
				x,
				elevation + surfaceTiles[row][column].height / 2,
				z);
			transform.updateMatrix();

			meshDict[surfaceTiles[row][column].type].setMatrixAt(surfaceTiles[row][column].instanceId, transform.matrix);
			meshDict[surfaceTiles[row][column].type].instanceMatrix.needsUpdate = true
		};
	};


	function changeTileType(type, row, column){

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

		transform.rotation.x = 0;
		transform.rotation.y = 0;
		transform.rotation.z = 0;
		transform.rotateY(-45 * THREE.Math.DEG2RAD);

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

	function deleteBuilding(){

		transform.scale.set(0, 0, 0);
		transform.position.set(-10, -10, -10);
		transform.updateMatrix();

		meshDict[selectedBuilding.meshName].setMatrixAt(selectedBuilding.instanceId, transform.matrix);
		meshDictIndex[selectedBuilding.meshName][1].push(selectedBuilding.instanceId);
		meshDict[selectedBuilding.meshName].instanceMatrix.needsUpdate = true;

		surfaceTiles[selectedBuilding.row][selectedBuilding.column] = 0;
	};


};

main();