import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import * as BoxBufferGeometry from './../libs/three.js-dev/src/geometries/BoxGeometry.js';
import { BufferGeometryUtils } from './../libs/three.js-dev/examples/jsm/utils/BufferGeometryUtils.js';
import { MTLLoader } from './../libs/three.js-dev/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from './../libs/three.js-dev/examples/jsm/loaders/OBJLoader.js';


var objLoader, mtlLoader;

objLoader = new OBJLoader();
mtlLoader = new MTLLoader();


export function createMeshes(countMap){


	// Dict to store all InstancedMeshes
	var meshDict, meshDictIndex;

	// Assign paths
	// This part will be automated.
	
	var texFilesDict_ground = {};
	var texFilesDict_building = {};
	var texFilesDict_flood = {};

	texFilesDict_building["b1"] = [
	"img/polyModels/OBJFiles/Models/Urban/Buildings/SPW_Urban_Bldg_01.obj",
	"img/polyModels/OBJFiles/Models/Urban/Buildings/SPW_Urban_Bldg_01.mtl",
	"img/polyModels/OBJFiles/Textures/Urban/SPW_Urban_Bldg_01_Color01.png"];
	//texFilesDict_building["b2"] = 0x333300;
	//texFilesDict_building["b3"] = 0x333333;
	//texFilesDict_building["s1"] = 0x333366;
	//texFilesDict_building["l1"] = 0x999900;

	texFilesDict_ground["w1"] = ["#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#52a0f6", "#52a0f6", "#52a0f6", "#52a0f6"];
	texFilesDict_ground["c1"] = ["#4b422b", "#4b422b", "#2a2518", "#2a2518", "#4b422b", "#4b422b", "#2a2518", "#2a2518", "#4b422b", "#4b422b", "#2a2518", "#2a2518", "#4b422b", "#4b422b", "#2a2518", "#2a2518", "#666666", "#666666", "#666666", "#666666"];
	texFilesDict_ground["g1"] = ["#1d2a18", "#1d2a18", "#121a0f", "#121a0f", "#1d2a18", "#1d2a18", "#121a0f", "#121a0f", "#1d2a18", "#1d2a18", "#121a0f", "#121a0f", "#1d2a18", "#1d2a18", "#121a0f", "#121a0f", "#3f5b34", "#3f5b34", "#3f5b34", "#3f5b34"];

	texFilesDict_flood["f1"] = ["#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#52a0f6", "#52a0f6", "#52a0f6", "#52a0f6"];;


	meshDict = {};
	meshDictIndex = {};

	for (name of Object.keys(texFilesDict_building)){
		meshDict[name] = returnInstancedMeshModel(
			texFilesDict_building[name][0], texFilesDict_building[name][1], texFilesDict_building[name][2], countMap[name] + 100);
		meshDict[name].name = name;
		meshDictIndex[name] = [0, []];
	};

	for (name of Object.keys(texFilesDict_ground)){
		meshDict[name] = returnInstancedMesh(
			1, texFilesDict_ground[name], countMap[name] + 100);
		meshDict[name].name = name;
		meshDictIndex[name] = [0, []];
	};

	for (name of Object.keys(texFilesDict_flood)){

		meshDict[name] = returnInstancedMesh(2, texFilesDict_flood[name], countMap[name] + 100);
		meshDict[name].name = name;
		meshDictIndex[name] = [0, []];
	};

	return [meshDict, meshDictIndex];
}


/**
	* Returns InstancedMesh with count number instances
	*
	* @param {path} obj The path of the model
	* @param {path} mtl The path of the mtl file
	* @param {path} tex The path of the texture file	
	* @param {path} count The number of instances
	* @return {InstancedMesh} InstancedMesh with count number instances
*/
function returnInstancedMesh(type, col, count=6000){

	var material;
	var geometry;
	var matrix = new THREE.Matrix4();

	var vertices = [

		// front
		{ pos: [-0.5, -0.5,  0.5], norm: [ 0,  0,  0.5], uv: [0, 1], }, // 0
		{ pos: [ 0.5, -0.5,  0.5], norm: [ 0,  0,  0.5], uv: [1, 1], }, // 1
		{ pos: [-0.5,  0.5,  0.5], norm: [ 0,  0,  0.5], uv: [0, 0], }, // 2
		{ pos: [ 0.5,  0.5,  0.5], norm: [ 0,  0,  0.5], uv: [1, 0], }, // 3
		// right
		{ pos: [ 0.5, -0.5,  0.5], norm: [ 0.5,  0,  0], uv: [0, 1], }, // 4
		{ pos: [ 0.5, -0.5, -0.5], norm: [ 0.5,  0,  0], uv: [1, 1], }, // 5
		{ pos: [ 0.5,  0.5,  0.5], norm: [ 0.5,  0,  0], uv: [0, 0], }, // 6
		{ pos: [ 0.5,  0.5, -0.5], norm: [ 0.5,  0,  0], uv: [1, 0], }, // 7
		// back
		{ pos: [ 0.5, -0.5, -0.5], norm: [ 0,  0, -0.5], uv: [0, 1], }, // 8
		{ pos: [-0.5, -0.5, -0.5], norm: [ 0,  0, -0.5], uv: [1, 1], }, // 9
		{ pos: [ 0.5,  0.5, -0.5], norm: [ 0,  0, -0.5], uv: [0, 0], }, // 0.50
		{ pos: [-0.5,  0.5, -0.5], norm: [ 0,  0, -0.5], uv: [1, 0], }, // 11
		// left
		{ pos: [-0.5, -0.5, -0.5], norm: [-0.5,  0,  0], uv: [0, 1], }, // 12
		{ pos: [-0.5, -0.5,  0.5], norm: [-0.5,  0,  0], uv: [1, 1], }, // 13
		{ pos: [-0.5,  0.5, -0.5], norm: [-0.5,  0,  0], uv: [0, 0], }, // 14
		{ pos: [-0.5,  0.5,  0.5], norm: [-0.5,  0,  0], uv: [1, 0], }, // 15
		// top
		{ pos: [ 0.5,  0.5, -0.5], norm: [ 0,  0.5,  0], uv: [0, 1], }, // 16
		{ pos: [-0.5,  0.5, -0.5], norm: [ 0,  0.5,  0], uv: [1, 1], }, // 17
		{ pos: [ 0.5,  0.5,  0.5], norm: [ 0,  0.5,  0], uv: [0, 0], }, // 18
		{ pos: [-0.5,  0.5,  0.5], norm: [ 0,  0.5,  0], uv: [1, 0], }, // 19
	];

	var positions = [];
	var normals = [];
	var uvs = [];
	for (let vertex of vertices) {
		positions.push(...vertex.pos);
		normals.push(...vertex.norm);
		uvs.push(...vertex.uv);
	};

	geometry = new THREE.BufferGeometry();

	geometry.setAttribute(
		'position',
		new THREE.BufferAttribute(new Float32Array(positions), 3));
	geometry.setAttribute(
		'normal',
		new THREE.BufferAttribute(new Float32Array(normals), 3));
	geometry.setAttribute(
		'uv',
		new THREE.BufferAttribute(new Float32Array(uvs), 2));


	if (type == 1){

		var color = [];
		for (var i=0; i < 20; i++){

			var _color = new THREE.Color(col[i]);
			color.push( _color.r , _color.g, _color.b );

		};

		geometry.setAttribute(
			"color",
			new THREE.BufferAttribute(new Float32Array(color), 3));
		material = new THREE.MeshLambertMaterial({
			vertexColors: THREE.VertexColors,
		});

	}

	else if (type == 2){

		var color = [];
		for (var i=0; i < 20; i++){

			var _color = new THREE.Color(col[i]);
			color.push( _color.r , _color.g, _color.b );

		};

		geometry.setAttribute(
			"color",
			new THREE.BufferAttribute(new Float32Array(color), 3));

		material = new THREE.MeshLambertMaterial({
			vertexColors: THREE.VertexColors,
			transparent: true,
			opacity:0.5
		});
	}

	else {

		material = new THREE.MeshLambertMaterial({
			color: col,
		});
	};

	geometry.setIndex([
		0,  1,  2,   2,  1,  3,
		4,  5,  6,   6,  5,  7,
		8,  9,  10,  10, 9,  11,
		12, 13, 14,  14, 13, 15,
		16, 17, 18,  18, 17, 19,
	]);
	
	geometry.rotateY(45 * THREE.Math.DEG2RAD);

	var mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.matrixAutoUpdate = false;
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
};


function returnInstancedMeshModel(obj, mtl, tex, count){

	var geometry, material, mesh, divide;

	divide = 15;

	var position = [];

	geometry = new THREE.BufferGeometry();
	material = new THREE.MeshLambertMaterial({
		map:textureReturn(tex),
		flatShading: true
	});

	mtlLoader.load(mtl, function (materials){
		materials.preload();
		objLoader
		.setMaterials(materials)
		.load(obj, function (object){

			for (var i = 0; i < object.children[0].geometry.attributes.position.array.length; i++) {
				position.push(object.children[0].geometry.attributes.position.array[i] / divide);
			};

			geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
			geometry.attributes.normal = object.children[0].geometry.attributes.normal;
			geometry.attributes.uv = object.children[0].geometry.attributes.uv;
			geometry.rotateY(-45 * THREE.Math.DEG2RAD);

		});
	});

	mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.matrixAutoUpdate = false;
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
};


/**
	* Returns texture loaded from given file
	*
	* @param {path} texPath The path of the texture file
	* @return {texture} texture loaded from given file
*/
function textureReturn(texPath){
	var texture = new THREE.TextureLoader().load(texPath);
	return texture
}
