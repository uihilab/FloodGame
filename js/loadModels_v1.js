import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import * as BoxBufferGeometry from './../libs/three.js-dev/src/geometries/BoxGeometry.js';


export function createMeshes(){


	// Dict to store all InstancedMeshes
	var meshDict, meshDictIndex;

	// Assign paths
	// This part will be automated.
	
	var texFilesDict = {};
	

	texFilesDict["b1"] = 0xff0000;
	texFilesDict["b2"] = 0xffff00;
	texFilesDict["b3"] = 0xff00ff;
	texFilesDict["s1"] = 0x45818E;
	texFilesDict["l1"] = 0x783F04;
	texFilesDict["w1"] = 0x00ffff;
	texFilesDict["g1"] = 0x00ff00;
	texFilesDict["c1"] = 0x9D9D9D;
	texFilesDict["t1"] = 0x274E13;

	meshDict = {};
	meshDictIndex = {};

	for (name of Object.keys(texFilesDict)){
		meshDict[name] = returnInstancedMesh(
			texFilesDict[name]);
		meshDict[name].name = name;
		meshDictIndex[name] = [0, []];
	}

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
function returnInstancedMesh(col, count=6000){

	var material;
	var geometry;
	geometry = new BoxBufferGeometry.BoxBufferGeometry(1, 1, 1);
	material = new THREE.MeshPhongMaterial({
		color:col,
		flatShading: true
	});

	return new THREE.InstancedMesh(geometry, material, count);
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
