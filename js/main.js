import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import { GUI } from './../libs/three.js-dev/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from "./../libs/three.js-dev/examples/jsm/controls/OrbitControls.js";
import Stats from './../libs/three.js-dev/examples/jsm/libs/stats.module.js';
import * as BoxBufferGeometry from './../libs/three.js-dev/src/geometries/BoxGeometry.js';

function main() {

	var camera, scene, renderer, stats, plane, elevation, transform, buildingControl, gui, buildingControl;
	var building1Mesh, building2Mesh, building3Mesh, waterMesh, greenMesh;
	var building1Geometry, building2Geometry, building3Geometry, waterGeometry, greenGeometry;
	var building1Material, building2Material, building3Material, waterMaterial, greenMaterial;
	var groundTiles, surfaceTiles;
	var meshDict, meshDictIndex;
	var obj;
	var maxBuildingHeight = 300;
	var identity = new THREE.Matrix4()

  var selectedBuilding = {
    "isSelected": false,
    "instanceId": -1,
    "meshName": "None",
    "z": [],
    "x": [],
    "size": -1,
    "height": 0
	};

	var selectedTile = {
		"isSelected": false,
		"instanceId": -1,
		"meshName": "None",
		"elevation": 0
	}

	var mesh;
  var buildingArray = ["b1", "b2", "b3"];
	var b1, b2, b3, w1, g1;
	var tileSize = 10;
	var numberOfTiles = 100;
	var numberOfTiles_X = Math.pow(numberOfTiles, 0.5)
	var side_length = numberOfTiles_X * tileSize;
	var elevationGround = 10; // No need for real implementation

	var amount = parseInt( window.location.search.substr( 1 ) ) || 10;
	var count = Math.pow( amount, 3 );

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2( 1, 1 );
	// var rotationMatrix = new THREE.Matrix4().makeRotationY( 0.1 );
	// var scaleMatrix = new THREE.Matrix4().makeScale(1, 100, 1);
	var instanceMatrix = new THREE.Matrix4();
	var matrix = new THREE.Matrix4();
	var vector3Scale = new THREE.Vector3(1, 1, 1);
	var vector3Position = new THREE.Vector3(1, 1, 1);

	var dest_vector3Scale = new THREE.Vector3(1, 1, 1);
	var dest_vector3Position = new THREE.Vector3(1, 1, 1);
	var dest_instanceMatrix = new THREE.Matrix4();

	// Create tile objects for ground
	groundTiles = [];
	for (var i = 0; i < numberOfTiles_X; i++){
		groundTiles.push([])
		for (var j = 0; j < numberOfTiles_X * 0.2; j++){
			groundTiles[i].push(new groundTile(
				i,
				j,
				elevationGround,
				"w1",
				i * 100 + j))
		}
	}
	for (var i = 0; i < numberOfTiles_X * 0.2; i++){
		for (var j = numberOfTiles_X * 0.2; j < numberOfTiles_X; j++){
			groundTiles[i].push(new groundTile(
				i,
				j,
				elevationGround,
				"w1",
				i * 100 + j))
				}
	}

	for (var i = numberOfTiles_X * 0.2; i < numberOfTiles_X; i++){
		for (var j = numberOfTiles_X * 0.2; j < numberOfTiles_X; j++){
			groundTiles[i].push(new groundTile(
				i,
				j,
				elevationGround,
				"g1",
				i * 100 + j))
    	}
	}
	console.log("groundTiles objects are created!!!");
  
	// Create tile objects for surface
	surfaceTiles = [];
	for (var i = 0; i < numberOfTiles_X; i++){
		surfaceTiles.push([])
		for (var j = 0; j < numberOfTiles_X; j++){
			surfaceTiles[i].push(0)
		}
	}

	// This part is created only for development
	surfaceTiles[3][3] = new surfaceTile(
							3,
							3,
							2,
							20,
							10,
							"b1",
							0);
	surfaceTiles[4][7] = new surfaceTile(
							7,
							4,
							3,
							20,
							10,
							"b2",
							0);
	surfaceTiles[7][8] = new surfaceTile(
							8,
							7,
							2,
							20,
							10,
							"b3",
							0);
	for (var i = 0; i < 2; i++){
    for (var  j = 0; j < 2; j++){
      // get rid of the if statement, additional cost
      if (i + j != 0){
        surfaceTiles[3 + i][3 + j] = 1;
      }
    }
	}

	for (var i = 0; i < 3; i++){
    for (var j = 0; j < 3; j++){
		  if (i + j != 0){
        surfaceTiles[4 + i][7 + j] = 1;
      }
	 }
  }
  for (var i = 0; i < 2; i++){
    for (var  j = 0; j < 2; j++){
      if (i + j != 0){
        surfaceTiles[7 + i][8 + j] = 1;
      }
    }
  }

	init();
	animate();

	function init() {

		// camera set up
		camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.x = 0;
		camera.position.y = 180;
		camera.position.z = 80;
		camera.lookAt(new THREE.Vector3(100, 0, 0));
		// Scene add
		scene = new THREE.Scene();

		//Lights
		var light = new THREE.HemisphereLight( 0xffffff, 0x880000, 0.5 );
		light.position.set( - 1, - 1.5, - 1 );
		scene.add( light );

		//Geometries and materials
		building1Geometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);
		building2Geometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);
		building3Geometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);
		waterGeometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);
		greenGeometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);

		building1Material = new THREE.MeshPhongMaterial( {color:0xff0000, flatShading: true});
		building2Material = new THREE.MeshPhongMaterial( {color:0xffff00, flatShading: true});
		building3Material = new THREE.MeshPhongMaterial( {color:0xff00ff, flatShading: true});
		waterMaterial = new THREE.MeshPhongMaterial( {color:0x00ffff, flatShading: true});
		greenMaterial = new THREE.MeshPhongMaterial( {color:0x00ff00, flatShading: true});

		meshDict = {};
		meshDict["b1"] = new THREE.InstancedMesh(building1Geometry, building1Material, 3000);
		meshDict["b1"].name = "b1";
		meshDict["b2"] = new THREE.InstancedMesh(building2Geometry, building2Material, 3000);
		meshDict["b2"].name = "b2";
		meshDict["b3"] = new THREE.InstancedMesh(building3Geometry, building3Material, 3000);
		meshDict["b3"].name = "b3";
		meshDict["w1"] = new THREE.InstancedMesh(waterGeometry, waterMaterial, 3000);
		meshDict["w1"].name = "w1";
		meshDict["g1"] = new THREE.InstancedMesh(greenGeometry, greenMaterial, 9000);
		meshDict["g1"].name = "g1";

    meshDictIndex = {}
    meshDictIndex["b1"] = [0, []]
    meshDictIndex["b2"] = [0, []]
    meshDictIndex["b3"] = [0, []]

    console.log("meshDict is created!!");
		// Create instances for ground tiles
		transform = new THREE.Object3D();
		b1 = b2 = b3 = w1 = g1 = 0

		//GroundTiles are added to meshes.
		for (var i = 0; i < numberOfTiles_X; i++){
			for (var j = 0; j < numberOfTiles_X; j++){
				obj = groundTiles[i][j];

				//write a function for that part
				transform.scale.set(tileSize, obj.elevation, tileSize);
				transform.position.set(
					tileSize / 2 + obj.x * tileSize - (side_length / 2),
					obj.elevation / 2,
					tileSize / 2 + obj.z * tileSize - (side_length / 2));
				transform.updateMatrix();
				if (obj.type == "g1"){meshDict["g1"].setMatrixAt(g1++, transform.matrix);}
				if (obj.type == "w1"){meshDict["w1"].setMatrixAt(w1++, transform.matrix);};
			}
		}

		// surfaceTiles are added to meshes.
		// Automatic way will be implemented.
		var pos_of_objects = [[3, 3], [4, 7], [7, 8]] // this list will be deleted
		for (i of pos_of_objects){
			obj = surfaceTiles[i[0]][i[1]];
			transform.scale.set(
				obj.size * tileSize,
				obj.height,
				obj.size * tileSize);
			transform.position.set(
				((2 * obj.x + obj.size) * tileSize / 2) - (side_length / 2),
				obj.elevation + obj.height / 2,
				((2 * obj.z + obj.size) * tileSize / 2) - (side_length / 2));
			transform.updateMatrix();
			if (obj.type == "b1"){meshDict["b1"].setMatrixAt(meshDictIndex["b1"][0]++, transform.matrix);}
			if (obj.type == "b2"){meshDict["b2"].setMatrixAt(meshDictIndex["b2"][0]++, transform.matrix);}
			if (obj.type == "b3"){meshDict["b3"].setMatrixAt(meshDictIndex["b3"][0]++, transform.matrix);}
		}

		scene.add(meshDict["w1"]);
		scene.add(meshDict["g1"]);
		scene.add(meshDict["b1"]);
		scene.add(meshDict["b2"]);
		scene.add(meshDict["b3"]);

    gui = new GUI();
    buildingControl = new function (){
      var self = this;
      this.height = selectedBuilding.height;
      this.changeHeight = function(){
        selectedBuilding.height = buildingControl.height;
        changeHeight(
          selectedBuilding.instanceId,
          selectedBuilding.meshName,
          buildingControl.height)
      }
    }
    var buildingGeneration = {
      addBuilding: function(){

      }
    }
    var buildingFolder = gui.addFolder("Building Option");
    buildingFolder.add(buildingControl, "height", 0, maxBuildingHeight).onChange(buildingControl.changeHeight).listen();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    new OrbitControls( camera, renderer.domElement );

    stats = new Stats();
    document.body.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousedown', onMouseClick, false );
    //changeHeight(selectedBuilding.instanceId, selectedBuilding.instancedmesh, buildingControl.height);
  }

    function onWindowResize() {

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function onMouseClick( event ) {
      event.preventDefault();
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      raycaster.setFromCamera( mouse, camera );
      var intersection = raycaster.intersectObjects( scene.children );
      if ( intersection.length > 0 ) {
        var meshName = intersection[0].object.name;
        var instanceId = intersection[ 0 ].instanceId;
        if (isBuilding(meshName)){
          if (selectedBuilding.isSelected == false){
            fillSelectedBuilding(instanceId, meshName);
            buildingControl.height = findHeight(
              instanceId,
              meshName)
          }
        }
        if (!isBuilding(meshName)){
          if (selectedBuilding.isSelected == true){

            changePosition(
              selectedBuilding.instanceId,
              selectedBuilding.meshName,
              instanceId,
              meshName)
            clearSelectedBuilding();
          }

          if (selectedTile.isSelected == false){
            selectedTile.isSelected = true;
            selectedTile.instanceId = instanceId;
            selectedTile.meshName = meshName;
            createBuilding(selectedTile, "b1", 2);
            clearSelectedBuilding();
            clearSelectedTile();

          }
        }

      
      // selectedBuilding.isSelected = true;
      // selectedBuilding.meshName = meshName;
      // selectedBuilding.instanceId = instanceId;
      // selectedBuilding.height = findHeight(
      //   instanceId,
      //   meshName)
      // buildingControl.height = findHeight(
      //   instanceId,
      //   meshName)
    }
    render();
  }


  function createBuilding(selectedTile, buildingType, size, index=0, height=20){
    var pos_z, pos_x, x_move, z_move, isValid, elevation_;
    meshDict[selectedTile.meshName].getMatrixAt(
      selectedTile.instanceId,
      instanceMatrix);
    vector3Scale.setFromMatrixScale(instanceMatrix);
    vector3Position.setFromMatrixPosition(instanceMatrix);

    pos_z = findPosition(vector3Scale.z, vector3Position.z);
    pos_x = findPosition(vector3Scale.x, vector3Position.x);
    size = size

    for (var i = 0; i < size; i++){
      for (var j = 0; j < size; j++){
        if (checkBuilding([pos_z, pos_x], i, j, size)){
          x_move = j;
          z_move = i;
          isValid = true;
          break;
        }
      }
    }

    if (isValid == false){
      console.log("not valid");
      return;
    }

    pos_z = pos_z - z_move;
    pos_x = pos_x - x_move;

    elevation_ = groundTiles[pos_z][pos_x].elevation;

    transform.scale.set(
      size * tileSize,
      height,
      size * tileSize);

    transform.position.set(
      ((2 * pos_x + size) * tileSize / 2) - (side_length / 2),
      elevation_ + height / 2,
      ((2 * pos_z + size) * tileSize / 2) - (side_length / 2));
    
    transform.updateMatrix();
    meshDict[buildingType].setMatrixAt(meshDictIndex[buildingType][0]++, transform.matrix);
    meshDict[buildingType].instanceMatrix.needsUpdate = true;
    setBuildingObject(
      pos_x,
      pos_z,
      size,
      height,
      elevation_,
      buildingType,
      meshDictIndex[buildingType][0] - 1)
    console.log(surfaceTiles)
  }

  function setBuildingObject(pos_x, pos_z, size, height, elevation, type, instanceId){
    var obj,
    obj = new surfaceTile(
      pos_x,
      pos_z,
      size,
      height,
      elevation,
      type,
      instanceId)

    surfaceTiles[pos_z][pos_x] = obj;
    for (var i = 0; i < size; i++){
      for (var j = 0; j < size; j++){
        if (i + j != 0){
          surfaceTiles[pos_z + i][pos_x + j] = 1;
        }
     }
    }

  }

  function isBuilding(meshName){
    if (buildingArray.includes(meshName)){return true;}
    else {return false;};
  }

  function findHeight(instanceId, meshName){
      meshDict[meshName].getMatrixAt(instanceId, instanceMatrix);
      vector3Scale.setFromMatrixScale(instanceMatrix);
      return vector3Scale.y;
  }


  function checkBuilding(posWorld, index_z, index_x, size){
    var x_move, z_move, newPos_x, newPos_z;
    for (var i = 0; i < size; i++){
      for (var j = 0; j < size; j++){
        z_move = i - index_z;
        x_move = j - index_x;
        newPos_z = posWorld[0] + z_move;
        newPos_x = posWorld[1] + x_move;
        if (newPos_z >= numberOfTiles_X || newPos_x >= numberOfTiles_X){return false;};
        if (newPos_z < 0 || newPos_x < 0){return false;};
        if (
          surfaceTiles[newPos_z][newPos_x] != 0 &&
          (!selectedBuilding.z.includes(newPos_z) && !selectedBuilding.x.includes(newPos_x))){return false;};
      }
    }
    return true;
  }

  
  function clearSelectedBuilding(){

    selectedBuilding.isSelected = false;
    selectedBuilding.instanceId = -1;
    selectedBuilding.meshName = "None";
    selectedBuilding.z = [];
    selectedBuilding.x = [];
    selectedBuilding.size = -1;
    selectedBuilding.height = 0;
  }

  function clearSelectedTile(){
    selectedTile.isSelected = false;
    selectedTile.instanceId = -1;
    selectedTile.meshName = "None";
    selectedTile.elevation = 0;

  }

  function fillSelectedBuilding(instanceId, meshName){
    var pos_x, pos_z, size;
    selectedBuilding.isSelected = true;
    selectedBuilding.meshName = meshName;
    selectedBuilding.instanceId = instanceId;
    [pos_z, pos_x, size] = findPosition_v2(instanceId, meshName);
    [selectedBuilding.z, selectedBuilding.x] = findBuildingPositions(pos_z, pos_x, size)
    selectedBuilding.height = findHeight(instanceId, meshName);
    selectedBuilding.size = size;
  }

  function findBuildingPositions(pos_z, pos_x, size){
    var z_pos = [];
    var x_pos = [];
    for (var i = 0; i < size; i++){
      for (var j = 0; j < size; j++){
        z_pos.push(pos_z + i);
        x_pos.push(pos_x + j);
      }
    }
    return [z_pos, x_pos];
  }
  function findPosition_v2(instanceId, meshName){
    var instanceMatrix_ = new THREE.Matrix4();
    var vector3Scale_ = new THREE.Vector3(1, 1, 1);
    var vector3Position_ = new THREE.Vector3(1, 1, 1);
    var pos_z, pos_x, size;

    meshDict[meshName].getMatrixAt(instanceId, instanceMatrix_);
    vector3Position_.setFromMatrixPosition(instanceMatrix_);
    vector3Scale_.setFromMatrixScale(instanceMatrix_);
    pos_z = findPosition(vector3Scale_.z, vector3Position_.z);
    pos_x = findPosition(vector3Scale_.x, vector3Position_.x);
    size = findSize(vector3Scale_.x);
    return [pos_z, pos_x, size];
  }

  function findPosition(scaleValue, posValue){
    var s, pos;
    s = scaleValue / tileSize;
    pos = (((posValue + (side_length / 2)) * 2 / tileSize) - s) / 2;
    return pos;  
  }

  function findSize(scaleValue){
    var s;
    s = scaleValue / tileSize;
    return s;
  }

  function generatePosition(size, pos){
    pos = ((2 * pos + size) * tileSize / 2) - (side_length / 2);
    return pos;
  }

  function changePosition(instanceId_S, meshName_S, instanceId_D, meshName_D){

    var size_building, dest_x, dest_z, start_x, start_z, x_move, z_move;
    var isValid = false;
    meshDict[meshName_D].getMatrixAt(instanceId_D, dest_instanceMatrix);
    dest_vector3Scale.setFromMatrixScale(dest_instanceMatrix);
    dest_vector3Position.setFromMatrixPosition(dest_instanceMatrix);

    dest_x = findPosition(dest_vector3Scale.x, dest_vector3Position.x);
    dest_z = findPosition(dest_vector3Scale.z, dest_vector3Position.z);
    
    meshDict[meshName_S].getMatrixAt(instanceId_S, instanceMatrix);
    vector3Scale.setFromMatrixScale(instanceMatrix);
    vector3Position.setFromMatrixPosition(instanceMatrix);


    size_building = findSize(vector3Scale.x);
    
    start_x = findPosition(vector3Scale.x, vector3Position.x);
    start_z = findPosition(vector3Scale.z, vector3Position.z);

    // write function
    for (var i = 0; i < size_building; i++){
      for (var j = 0; j < size_building; j++){
        if (checkBuilding([dest_z, dest_x], i, j, size_building)){
          x_move = j;
          z_move = i;
          isValid = true;
          break;
        }
      }
    }

    if (isValid == false){
      console.log("not valid");
      return;
    }

    dest_z = dest_z - z_move;
    dest_x = dest_x - x_move;

    //write function
    surfaceTiles[dest_z][dest_x] = surfaceTiles[start_z][start_x];
    surfaceTiles[dest_z][dest_x].x = dest_x;
    surfaceTiles[dest_z][dest_x].z = dest_z;
    for (var i = 0; i < size_building; i++){
      for (var j = 0; j < size_building; j++){
        if (i + j != 0){
          surfaceTiles[dest_z + i][dest_x + j] = 1;
        }
     }
    }

    for (var i = 0; i < size_building; i++){
      for (var j = 0; j < size_building; j++){
        surfaceTiles[start_z + i][start_x + j] = 0;
     }
    }

    vector3Position.x = generatePosition(size_building, dest_x);
    vector3Position.z = generatePosition(size_building, dest_z);
    vector3Position.y = dest_vector3Scale.y + vector3Scale.y / 2;
    instanceMatrix.setPosition(vector3Position);
    meshDict[meshName_S].setMatrixAt(instanceId_S, instanceMatrix);
    meshDict[meshName_S].instanceMatrix.needsUpdate = true;
  }



  function changeHeight (instanceId, meshName, new_height){
    var pos_z, pos_x, size;
    if (isBuilding(meshName)){
      meshDict[meshName].getMatrixAt(instanceId, instanceMatrix);
      vector3Scale.setFromMatrixScale(instanceMatrix);
      buildingControl.height = vector3Scale.y;
      vector3Position.setFromMatrixPosition(instanceMatrix);
      vector3Position.y = (vector3Position.y - vector3Scale.y / 2) 
      vector3Scale.y = new_height;
      vector3Position.y += vector3Scale.y / 2
      instanceMatrix.makeScale(vector3Scale.x, vector3Scale.y, vector3Scale.z);
      instanceMatrix.setPosition(vector3Position);
      meshDict[meshName].setMatrixAt(instanceId, instanceMatrix);
      meshDict[meshName].instanceMatrix.needsUpdate = true;

      pos_z = findPosition(vector3Scale.z, vector3Position.z);
      pos_x = findPosition(vector3Scale.x, vector3Position.x);
      surfaceTiles[pos_z][pos_x].height = new_height;
    }
  }

  function animate() {
    requestAnimationFrame( animate );

    render();

  }

  function render() {
    renderer.render( scene, camera );
    stats.update();

  }
};


function groundTile (position_x, position_z, elevation, type, instanceId){
	this.x  = position_x;
	this.z = position_z;
	this.elevation = elevation;
	this.type = type;
	this.instanceId = instanceId;
}

function surfaceTile(position_x, position_z, size, height, elevation, type, instanceId){
	this.x  = position_x;
	this.z = position_z;
	this.elevation = elevation;
	this.type = type;
	this.instanceId = instanceId;
	this.height = height;
	this.size = size;
}


function createGroundPlane(scene, size_x, size_y, div_x, div_y, texture="img/8.jpg") {

  // create the ground plane
  var texturePlane = new THREE.TextureLoader().load("img/8.jpg");
  texturePlane.wrapS = THREE.RepeatWrapping;
  texturePlane.wrapT = THREE.RepeatWrapping;
  texturePlane.repeat.set(div_x, div_y);

  // create the ground plane
  var planeGeometry = new THREE.PlaneGeometry(size_x, size_y, div_x, div_y);
  var planeMaterial = new THREE.MeshLambertMaterial({
    map: texturePlane
  });
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  var gridHelper = new THREE.GridHelper( size_x, div_x );
  
  // rotate and position the plane
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 0;
  plane.position.y = 0;
  plane.position.z = 0;

  scene.add(plane);
  scene.add( gridHelper );
  return plane;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
main();