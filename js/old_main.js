import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import { GUI } from './../libs/three.js-dev/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from "./../libs/three.js-dev/examples/jsm/controls/OrbitControls.js";
import Stats from './../libs/three.js-dev/examples/jsm/libs/stats.module.js';
import * as BoxBufferGeometry from './../libs/three.js-dev/src/geometries/BoxGeometry.js';

function init() {

  var camera, scene, renderer, stats, plane, elevation, transform;
  var mesh;
  var amount = parseInt( window.location.search.substr( 1 ) ) || 10;
  var count = Math.pow( amount, 3 );
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2( 1, 1 );
  var rotationMatrix = new THREE.Matrix4().makeRotationY( 0.1 );
  var scaleMatrix = new THREE.Matrix4().makeScale(1, 100, 1);
  var instanceMatrix = new THREE.Matrix4();
  var matrix = new THREE.Matrix4();
  var vector3 = new THREE.Vector3(1, 1, 1);
  init_v2();
  animate();
  function init_v2() {
    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.x = 0;
    camera.position.y = 180;
    camera.position.z = 80;
    camera.lookAt(new THREE.Vector3(100, 0, 0));

    scene = new THREE.Scene();
    plane = createGroundPlane(scene, 100, 100, 10, 10)

    var light = new THREE.HemisphereLight( 0xffffff, 0x000088 );
    light.position.set( - 1, 1.5, 1 );
    scene.add( light );

    var light = new THREE.HemisphereLight( 0xffffff, 0x880000, 0.5 );
    light.position.set( - 1, - 1.5, - 1 );
    scene.add( light );

    var geometry = new BoxBufferGeometry.BoxBufferGeometry(10, 10, 10 );
    var material = new THREE.MeshPhongMaterial( { color: Math.random() * 0xffffff, flatShading: true } );

    mesh = new THREE.InstancedMesh( geometry, material, 10*10 );
 

    var i = 0;
    var offset = ( amount - 1 ) / 2;

    transform = new THREE.Object3D();

    for (var x = 5; x < 100; x += 10){
      for (var z = 5; z < 100; z += 10){
        elevation = Math.random()
        //transform.scale.set(1, elevation * 2, 1);
        transform.position.set(x - 50, 5, z - 50);
        transform.name = "ali" ;
        transform.updateMatrix();
        mesh.setMatrixAt(i ++, transform.matrix);
      }
    }

    // for ( var x = 0; x < amount; x ++ ) {

    //   for ( var y = 0; y < amount; y ++ ) {

    //     for ( var z = 0; z < amount; z ++ ) {

    //       transform.position.set( offset - x, offset - y, offset - z );
    //       transform.updateMatrix();
    //       mesh.setMatrixAt( i ++, transform.matrix );

    //     }

    //   }

    // }

    scene.add( mesh );
    console.log(mesh);
    //

    var gui = new GUI();
    gui.add( mesh, 'count', 0, count );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    new OrbitControls( camera, renderer.domElement );

    stats = new Stats();
    document.body.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousedown', onMouseMove, false );

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  function onMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersection = raycaster.intersectObject( mesh );
    var r = Math.random();
    var scaleMatrix = new THREE.Matrix4().makeScale(1, 10 * r, 1);

    if ( intersection.length > 0 ) {
      var instanceId = intersection[ 0 ].instanceId;
      console.log(intersection[0]);
      mesh.getMatrixAt( instanceId, instanceMatrix );
      vector3.setFromMatrixPosition(instanceMatrix);
      vector3.x = 40
      vector3.y = 10
      vector3.z = 10
      instanceMatrix.setPosition(vector3)
      //instanceMatrix.setPosition(40, 10, 10);
      //instanceMatrix.elements[12] = 10
      //instanceMatrix.elements[13] = 10
      //instanceMatrix.elements[14] = 10
      //instanceMatrix.elements[5] = 10;
      matrix.multiplyMatrices( instanceMatrix, scaleMatrix );
      
      console.log(vector3.x);
      console.log(instanceMatrix.elements)


      mesh.setMatrixAt( instanceId, matrix );
      mesh.instanceMatrix.needsUpdate = true;

    }
    render();


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

  // rotate and position the plane
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 0;
  plane.position.y = 0;
  plane.position.z = 0;

  scene.add(plane)
  return plane;
}
init();