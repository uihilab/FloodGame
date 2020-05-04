import * as THREE from "./../libs/three.js-dev/build/three.module.js"
import { MTLLoader } from './../libs/three.js-dev/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from './../libs/three.js-dev/examples/jsm/loaders/OBJLoader.js';



var objLoader, mtlLoader;

objLoader = new OBJLoader();
mtlLoader = new MTLLoader();

export function createBuildingMeshes(){

	// // Geometries and Materials
	// 	// Buildings
	// var building1Geo, building2Geo, building3Geo;
	// var apartment1Geo, smallBuilding1Geo;

	// var building1Mat, building2Mat, building3Mat;
	// var apartment1Mat, smallBuilding1Mat;

	// 	//Ground Types
	// var concreteGeo, grassFlatGeo, waterGeo;
	// var concreteMat, grassFlatMat, waterMat;

	// Dicts to store paths 
	var objFilesDict, mtlFilesDict, texFilesDict;

	// Dict to store all InstancedMeshes
	var meshDict, meshDictIndex;

	// Assign paths
	// This part will be automated.
	objFilesDict = {};
	mtlFilesDict = {};
	texFilesDict = {};

	objFilesDict["building1"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Urban/Buildings/SPW_Urban_Bldg_01.obj";
	objFilesDict["building2"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Urban/Buildings/SPW_Urban_Bldg_02.obj";
	objFilesDict["building3"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Urban/Buildings/SPW_Urban_Bldg_03.obj";
	objFilesDict["concrete"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Natures/Terrain/SPW_Terrain_Concrete.obj";
	objFilesDict["grassFlat"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Natures/Terrain/SPW_Terrain_Grass_Flat.obj";
	objFilesDict["water"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Natures/Terrain/SPW_Terrain_Water.obj";

	mtlFilesDict["building1"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Urban/Buildings/SPW_Urban_Bldg_01.mtl";
	mtlFilesDict["building2"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Urban/Buildings/SPW_Urban_Bldg_02.mtl";
	mtlFilesDict["building3"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Urban/Buildings/SPW_Urban_Bldg_03.mtl";
	mtlFilesDict["concrete"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Natures/Terrain/SPW_Terrain_Concrete.mtl";
	mtlFilesDict["grassFlat"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Natures/Terrain/SPW_Terrain_Grass_Flat.mtl";
	mtlFilesDict["water"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Models/Natures/Terrain/SPW_Terrain_Water.mtl";


	texFilesDict["building1"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Textures/Urban/SPW_Urban_Bldg_01_Color01.png";
	texFilesDict["building2"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Textures/Urban/SPW_Urban_Bldg_02_Color01.png";
	texFilesDict["building3"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Textures/Urban/SPW_Urban_Bldg_03_Color01.png";
	texFilesDict["concrete"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Textures/Natures/SPW_Natures_01.png";
	texFilesDict["grassFlat"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Textures/Natures/SPW_Natures_01.png";
	texFilesDict["water"] = "img/uploads_files_658464_SimplePoly_Urban.OBJ/Textures/Natures/SPW_Natures_01.png";

	meshDict = {};
	meshDictIndex = {};

	for (name of Object.keys(objFilesDict)){
		meshDict[name] = returnInstancedMesh(
			objFilesDict[name],
			mtlFilesDict[name],
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
function returnInstancedMesh(obj, mtl, tex, count=100){

	var geometry, material;
	// It can be changed to BufferGeometry
	geometry = new THREE.InstancedBufferGeometry();
	material = new THREE.MeshPhongMaterial({
		map:textureReturn(tex),
		flatShading: true
	});
	mtlLoader.load(mtl, function (materials){
		materials.preload();
		objLoader
			.setMaterials(materials)
			.load(obj, function (object){
				geometry.index = object.children[0].geometry.index;
				geometry.attributes.position = object.children[0].geometry.attributes.position;
				geometry.attributes.uv = object.children[0].geometry.attributes.uv;
			});
				
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
