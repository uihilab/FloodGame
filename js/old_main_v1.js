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
  var maxBuildingHeight = 300;
  var identity = new THREE.Matrix4()
  var selectedBuilding = {
    "isSelected": false,
    "instanceId": -1,
    "instancedmesh": "None",
    "height": 0
  };

  var selectedTile = {
    "isSelected": false,
    "instanceId": -1,
    "instancedmesh": "None",
    "elevation": 0
  }
  var mesh;

  var b1, b2, b3, w1, g1;
  var tileSize = 10;
  var numberOfTiles = 10000;
  var numberOfTiles_X = Math.pow(numberOfTiles, 0.5)
  var side_length = numberOfTiles_X * tileSize;

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
  for (var i = 0; i < numberOfTiles_X * 0.2; i++){
    for (var j = 0; j < numberOfTiles_X; j++){
      groundTiles.push(new groundTile(
        i,
        j,
        10,
        "water",
        i * 100 + j))
    }
  }
  for (var i = numberOfTiles_X * 0.2; i < numberOfTiles_X; i++){
    for (var j = 0; j < numberOfTiles_X; j++){
      groundTiles.push(new groundTile(
        i,
        j,
        10,
        "green",
        i * 100 + j))
    }
  }
  
  //Create tile objects for surface
  surfaceTiles = [];
  for( i of groundTiles){
    if (i.type != "green") {continue;}
    if (Math.random() > 0.5) {continue;}
    surfaceTiles.push(new surfaceTile(
      i.x,
      i.z,
      Math.random() * 20,
      getRandomInt(3),
      i.elevation,
      i.instanceId))
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
    // plane is created it is not neccessary since 
    plane = createGroundPlane(
      scene,
      numberOfTiles_X * tileSize,
      numberOfTiles_X * tileSize,
      numberOfTiles_X,
      numberOfTiles_X)
    //Lights
    var light = new THREE.HemisphereLight( 0xffffff, 0x880000, 0.5 );
    light.position.set( - 1, - 1.5, - 1 );
    scene.add( light );

    //Geometries and materials
    building1Geometry = new BoxBufferGeometry.BoxBufferGeometry(0.8, 1, 0.8);
    building2Geometry = new BoxBufferGeometry.BoxBufferGeometry(0.8, 1, 0.8);
    building3Geometry = new BoxBufferGeometry.BoxBufferGeometry(0.8, 1, 0.8);
    waterGeometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);
    greenGeometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);

    building1Material = new THREE.MeshPhongMaterial( {color:0xff0000, flatShading: true});
    building2Material = new THREE.MeshPhongMaterial( {color:0xffff00, flatShading: true});
    building3Material = new THREE.MeshPhongMaterial( {color:0xff00ff, flatShading: true});
    waterMaterial = new THREE.MeshPhongMaterial( {color:0x00ffff, flatShading: true});
    greenMaterial = new THREE.MeshPhongMaterial( {color:0x00ff00, flatShading: true});

    building1Mesh = new THREE.InstancedMesh(building1Geometry, building1Material, 3000);
    building1Mesh.name = "building1";
    building2Mesh = new THREE.InstancedMesh(building2Geometry, building2Material, 3000);
    building2Mesh.name = "building2";
    building3Mesh = new THREE.InstancedMesh(building3Geometry, building3Material, 3000);
    building3Mesh.name = "building3";
    waterMesh = new THREE.InstancedMesh(waterGeometry, waterMaterial, 3000);
    waterMesh.name = "water";
    greenMesh = new THREE.InstancedMesh(greenGeometry, greenMaterial, 9000);
    greenMesh.name = "green";


    // Create instances for ground tiles
    transform = new THREE.Object3D();
    b1=b2=b3=w1=g1=0

    for (i of groundTiles){
      transform.scale.set(tileSize, i.elevation, tileSize);
      transform.position.set(
        tileSize / 2 + i.x * tileSize - (side_length / 2),
        i.elevation / 2,
        tileSize / 2 + i.z * tileSize - (side_length / 2));
      transform.updateMatrix();
      if (i.type == "green"){greenMesh.setMatrixAt(g1++, transform.matrix);}
      else {waterMesh.setMatrixAt(w1++, transform.matrix);};
    }
    for (i of surfaceTiles){
      transform.scale.set(tileSize, i.height, tileSize);
      transform.position.set(
        tileSize / 2 + i.x * tileSize - (side_length / 2),
        i.elevation + i.height / 2,
        tileSize / 2 + i.z * tileSize - (side_length / 2));
      transform.updateMatrix();
      if (i.type == 1){building1Mesh.setMatrixAt(b1++, transform.matrix);}
      else if (i.type == 2){building2Mesh.setMatrixAt(b2++, transform.matrix);}
      else {building3Mesh.setMatrixAt(b3++, transform.matrix)};
    }
    scene.add(waterMesh);
    scene.add(greenMesh);
    scene.add(building1Mesh);
    scene.add(building2Mesh);
    scene.add(building3Mesh);

    gui = new GUI();
    buildingControl = new function (){
      var self = this;
      this.height = selectedBuilding.height;
      this.changeHeight = function(){
        selectedBuilding.height = buildingControl.height;
        changeHeight(
          selectedBuilding.instanceId,
          selectedBuilding.instancedmesh,
          buildingControl.height)
      }
    }
    var buildingGeneration = {
      addBuilding: function(){

      }
    }
    gui.add( waterMesh, 'count', 0, w1 );
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
      console.log(intersection[0].object);
      var instanceId = intersection[ 0 ].instanceId;
      if (isBuilding(meshName)){
        if (selectedBuilding.isSelected == false){

          selectedBuilding.isSelected = true;
          selectedBuilding.instancedmesh = meshName;
          selectedBuilding.instanceId = instanceId;
          selectedBuilding.height = findHeight(
            instanceId,
            meshName)
          buildingControl.height = findHeight(
            instanceId,
            meshName)
        }
      }
      if (!isBuilding(meshName)){
        if (selectedBuilding.isSelected == true){
          changePosition(
            selectedBuilding.instanceId,
            selectedBuilding.instancedmesh,
            instanceId,
            meshName)

          selectedBuilding.isSelected = false;
        }
        if (selectedTile.isSelected == false){
          console.log("deneme")
          //selectedTile.isSelected = true;
          selectedTile.instanceId = instanceId;
          selectedTile.instancedmesh = meshName;
          createBuilding(selectedTile, b1+1);
          b1 += 1;
          selectedBuilding.isSelected = false;
        }
      }

      
      selectedBuilding.isSelected = true;
      selectedBuilding.instancedmesh = meshName;
      selectedBuilding.instanceId = instanceId;
      selectedBuilding.height = findHeight(
        instanceId,
        meshName)
      buildingControl.height = findHeight(
        instanceId,
        meshName)
      //changeHeight(instanceId, meshName, buildingControl.height);
    }
    render();


  }


function createBuilding(selectedTile, index){
  greenMesh.getMatrixAt(
    selectedTile.instanceId,
    instanceMatrix);
  vector3Scale.setFromMatrixScale(instanceMatrix);
  vector3Position.setFromMatrixPosition(instanceMatrix);
  transform.scale.set(tileSize, tileSize, tileSize);
  transform.position.set(
    vector3Position.x,
    vector3Scale.y + tileSize / 2,
    vector3Position.z)
  transform.updateMatrix()
  building1Mesh.setMatrixAt(index, transform.matrix)
  building1Mesh.instanceMatrix.needsUpdate = true;


}
  function isBuilding(meshName){
    if (
      meshName == "building1" || 
      meshName == "building2" || 
      meshName == "building3") {return true;}
    else {return false;};
  }

  function findHeight(instanceId, meshName){
      if (meshName == "building1"){
        building1Mesh.getMatrixAt(instanceId, instanceMatrix);
        vector3Scale.setFromMatrixScale(instanceMatrix);
        return vector3Scale.y;
      }
      if (meshName == "building2"){
        building2Mesh.getMatrixAt(instanceId, instanceMatrix);
        vector3Scale.setFromMatrixScale(instanceMatrix);
        return vector3Scale.y;
      }
      if (meshName == "building3"){
        building2Mesh.getMatrixAt(instanceId, instanceMatrix);
        vector3Scale.setFromMatrixScale(instanceMatrix);
        return vector3Scale.y;
      }
  }

  function changePosition(instanceId_S, meshName_S, instanceId_D, meshName_D){
    if (meshName_D == "green"){
      greenMesh.getMatrixAt(instanceId_D, dest_instanceMatrix);
      dest_vector3Scale.setFromMatrixScale(dest_instanceMatrix);
      dest_vector3Position.setFromMatrixPosition(dest_instanceMatrix);
    }
    if (meshName_S == "building1"){
      building1Mesh.getMatrixAt(instanceId_S, instanceMatrix);
      vector3Scale.setFromMatrixScale(instanceMatrix);
      vector3Position.setFromMatrixPosition(instanceMatrix);
      vector3Position.x = dest_vector3Position.x
      vector3Position.z = dest_vector3Position.z
      vector3Position.y = dest_vector3Scale.y + vector3Scale.y / 2;
      instanceMatrix.setPosition(vector3Position);
      building1Mesh.setMatrixAt(instanceId_S, instanceMatrix);
      building1Mesh.instanceMatrix.needsUpdate = true;

    }
    if (meshName_S == "building2"){
      building2Mesh.getMatrixAt(instanceId_S, instanceMatrix);
      vector3Scale.setFromMatrixScale(instanceMatrix);
      vector3Position.setFromMatrixPosition(instanceMatrix);
      vector3Position.x = dest_vector3Position.x
      vector3Position.z = dest_vector3Position.z
      vector3Position.y = dest_vector3Scale.y + vector3Scale.y / 2;
      instanceMatrix.setPosition(vector3Position);
      building2Mesh.setMatrixAt(instanceId_S, instanceMatrix);
      building2Mesh.instanceMatrix.needsUpdate = true;

    }
    if (meshName_S == "building3"){
      building3Mesh.getMatrixAt(instanceId_S, instanceMatrix);
      vector3Scale.setFromMatrixScale(instanceMatrix);
      vector3Position.setFromMatrixPosition(instanceMatrix);
      vector3Position.x = dest_vector3Position.x
      vector3Position.z = dest_vector3Position.z
      vector3Position.y = dest_vector3Scale.y + vector3Scale.y / 2;
      instanceMatrix.setPosition(vector3Position);
      building3Mesh.setMatrixAt(instanceId_S, instanceMatrix);
      building3Mesh.instanceMatrix.needsUpdate = true;

    }
  }
  function changeHeight (instanceId, meshName, new_height){
      if (meshName == "building1"){
        building1Mesh.getMatrixAt(instanceId, instanceMatrix);
        vector3Scale.setFromMatrixScale(instanceMatrix);
        buildingControl.height = vector3Scale.y;
        vector3Position.setFromMatrixPosition(instanceMatrix);
        vector3Position.y = (vector3Position.y - vector3Scale.y / 2) 
        vector3Scale.y = new_height;
        vector3Position.y += vector3Scale.y / 2
        instanceMatrix.makeScale(vector3Scale.x, vector3Scale.y, vector3Scale.z);
        instanceMatrix.setPosition(vector3Position);
        building1Mesh.setMatrixAt(instanceId, instanceMatrix);
        building1Mesh.instanceMatrix.needsUpdate = true;
      }
      if (meshName == "building2"){
        building2Mesh.getMatrixAt(instanceId, instanceMatrix);
        vector3Scale.setFromMatrixScale(instanceMatrix);
        vector3Position.setFromMatrixPosition(instanceMatrix);
        vector3Position.y = (vector3Position.y - vector3Scale.y / 2) 
        vector3Scale.y = new_height;
        vector3Position.y += vector3Scale.y / 2
        instanceMatrix.makeScale(vector3Scale.x, vector3Scale.y, vector3Scale.z);
        instanceMatrix.setPosition(vector3Position);
        building2Mesh.setMatrixAt(instanceId, instanceMatrix);
        building2Mesh.instanceMatrix.needsUpdate = true;
      }
      if (meshName == "building3"){
        building3Mesh.getMatrixAt(instanceId, instanceMatrix);
        vector3Scale.setFromMatrixScale(instanceMatrix);
        vector3Position.setFromMatrixPosition(instanceMatrix);
        vector3Position.y = (vector3Position.y - vector3Scale.y / 2) 
        vector3Scale.y  = new_height;
        vector3Position.y += vector3Scale.y / 2
        instanceMatrix.makeScale(vector3Scale.x, vector3Scale.y, vector3Scale.z);
        instanceMatrix.setPosition(vector3Position);
        building3Mesh.setMatrixAt(instanceId, instanceMatrix);
        building3Mesh.instanceMatrix.needsUpdate = true;
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

function surfaceTile(position_x, position_z, height, type, elevation, instanceId){
  this.x  = position_x;
  this.z = position_z;
  this.elevation = elevation;
  this.type = type;
  this.instanceId = instanceId;
  this.height = height;
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