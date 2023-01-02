import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import * as BoxBufferGeometry from './../libs/three.js-dev/src/geometries/BoxGeometry.js';


export function createMeshes(){


	// Dict to store all InstancedMeshes
	var meshDict, meshDictIndex;

	// Assign paths
	// This part will be automated.
	
	var texFilesDict_ground = {};
	var texFilesDict_building = {};
	

	texFilesDict_building["b1"] = 0x330000;
	texFilesDict_building["b2"] = 0x333300;
	texFilesDict_building["b3"] = 0x333333;
	texFilesDict_building["s1"] = 0x333366;
	texFilesDict_building["l1"] = 0x999900;

	texFilesDict_ground["w1"] = ["#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#52a0f6", "#52a0f6", "#52a0f6", "#52a0f6", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75"];
	texFilesDict_ground["c1"] = ["#4b422b", "#4b422b", "#2a2518", "#2a2518", "#4b422b", "#4b422b", "#2a2518", "#2a2518", "#666666", "#666666", "#666666", "#666666", "#4b422b", "#4b422b", "#2a2518", "#2a2518", "#4b422b", "#4b422b", "#2a2518", "#2a2518", "#4b422b", "#4b422b", "#2a2518", "#2a2518"];
	texFilesDict_ground["g1"] = ["#1d2a18", "#1d2a18", "#121a0f", "#121a0f", "#1d2a18", "#1d2a18", "#121a0f", "#121a0f", "#3f5b34", "#3f5b34", "#3f5b34", "#3f5b34", "#1d2a18", "#1d2a18", "#121a0f", "#121a0f", "#1d2a18", "#1d2a18", "#121a0f", "#121a0f", "#1d2a18", "#1d2a18", "#121a0f", "#121a0f"];

	meshDict = {};
	meshDictIndex = {};

	for (name of Object.keys(texFilesDict_building)){
		meshDict[name] = returnInstancedMesh_building(
			texFilesDict_building[name], 1000);
		meshDict[name].name = name;
		meshDictIndex[name] = [0, []];
	};

	for (name of Object.keys(texFilesDict_ground)){
		meshDict[name] = returnInstancedMesh_ground(
			texFilesDict_ground[name]);
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
function returnInstancedMesh_building(col, count=6000){

	var material;
	var geometry;
	geometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);


	material = new THREE.MeshPhongMaterial({
		flatShading: true,
		color: col,
	});

	var mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
};

/**
	* Returns InstancedMesh with count number instances
	*
	* @param {path} obj The path of the model
	* @param {path} mtl The path of the mtl file
	* @param {path} tex The path of the texture file	
	* @param {path} count The number of instances
	* @return {InstancedMesh} InstancedMesh with count number instances
*/
function returnInstancedMesh_ground(col, count=6000){

	var material;
	var geometry;
	geometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);
	material = new THREE.MeshPhongMaterial({
		flatShading: true,
		vertexColors: THREE.VertexColors,
	});

	var color = [];

	for (var i=0; i < 24; i++){
		var _color = new THREE.Color(col[i]);

		color.push( _color.r , _color.g, _color.b );
	};
	
	geometry.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
	var mesh = new THREE.InstancedMesh(geometry, material, count);
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
