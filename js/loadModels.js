import * as THREE from "./../libs/threejs/three.module.js"
import * as BoxBufferGeometry from './../libs/threejs/BoxGeometry.js';
import { BufferGeometryUtils } from './../libs/threejs/BufferGeometryUtils.js';
import { MTLLoader } from './../libs/threejs/MTLLoader.js';
import { OBJLoader } from './../libs/threejs/OBJLoader.js';


var objLoader, mtlLoader;

objLoader = new OBJLoader();
mtlLoader = new MTLLoader();


export function createMeshes(countMap){


	// Dict to store all InstancedMeshes
	var meshDict, meshDictIndex;

	// Assign paths
	// This part will be automated.
	
	var texFilesDict_ground = {};
	var texFilesDict_groundd = {};
	var texFilesDict_building = {};
	var texFilesDict_flood = {};
	var modelSize = {};



texFilesDict_building["Bank"] = [
	"models/polyModels/Models/SPB_Bank.obj",
	"models/polyModels/Models/SPB_Bank.mtl",
	"models/polyModels/Textures/SPB_Bank.png"];

texFilesDict_building["Chu"] = [
	"models/polyModels/Models/SPB_Church.obj",
	"models/polyModels/Models/SPB_Church.mtl",
	"models/polyModels/Textures/SPB_Church.png"];

texFilesDict_building["Chse"] = [
	"models/polyModels/Models/SPB_Court House.obj",
	"models/polyModels/Models/SPB_Court House.mtl",
	"models/polyModels/Textures/SPB_Court House.png"];

texFilesDict_building["Htl"] = [
	"models/polyModels/Models/SPB_Hotel.obj",
	"models/polyModels/Models/SPB_Hotel.mtl",
	"models/polyModels/Textures/SPB_Hotel.png"];

texFilesDict_building["Com2"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_15.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_15.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_15.png"];	

texFilesDict_building["Gas"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_Gas Station.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_Gas Station.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_Gas Station_Color02.png"];	

texFilesDict_building["Hll"] = [
	"models/polyModels/Models/SPB_City Hall.obj",
	"models/polyModels/Models/SPB_City Hall.mtl",
	"models/polyModels/Textures/SPB_City Hall.png"];





texFilesDict_building["Res1"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_01.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_01_Color01.png"];

texFilesDict_building["Res2"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_02.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_02.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_02_Color01.png"];

texFilesDict_building["Res3"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_01.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_01_Color02.png"];

texFilesDict_building["tree"] = [
	"models/polyModels/Models/SPW_Natures_Tree_02.obj",
	"models/polyModels/Models/SPW_Natures_Tree_02.mtl",
	"models/polyModels/Textures/SPW_Natures_01.png"];

texFilesDict_building["tree2"] = [
	"models/polyModels/Models/SPW_Natures_Tree_Fir_02.obj",
	"models/polyModels/Models/SPW_Natures_Tree_Fir_02.mtl",
	"models/polyModels/Textures/SPW_Natures_01.png"];

texFilesDict_building["road_v"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]
texFilesDict_building["road_h"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_right_down_2"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_Corner_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_Corner_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_left_down_2"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_Corner_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_Corner_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_left_up_2"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_Corner_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_Corner_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_right_up_2"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_Corner_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_Corner_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_up_down_right_3"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_T_Intersection_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_T_Intersection_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]


texFilesDict_building["road_left_right_down_3"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_T_Intersection_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_T_Intersection_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]


texFilesDict_building["road_up_down_left_3"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_T_Intersection_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_T_Intersection_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_left_right_up_3"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_T_Intersection_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_T_Intersection_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_v_down_1"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_04.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_04.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_h_left_1"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_04.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_04.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_v_up_1"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_04.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_04.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["road_h_right_1"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_04.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_04.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]


texFilesDict_building["road_c"] = [
	"models/polyModels/Models/SPW_Urban_Road 2way_Intersection_01.obj",
	"models/polyModels/Models/SPW_Urban_Road 2way_Intersection_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]

texFilesDict_building["parking"] = [
	"models/polyModels/Models/SPW_Urban_Road Parking Lot Small.obj",
	"models/polyModels/Models/SPW_Urban_Road Parking Lot Small.mtl",
	"models/polyModels/Textures/SPW_Urban_Road.png"
]
texFilesDict_building["Pol"] = [
	"models/polyModels/Models/SPB_Police Station.obj",
	"models/polyModels/Models/SPB_Police Station.mtl",
	"models/polyModels/Textures/SPB_Police Station.png"
]

texFilesDict_building["Fire"] = [
	"models/polyModels/Models/SPB_Fire Station.obj",
	"models/polyModels/Models/SPB_Fire Station.mtl",
	"models/polyModels/Textures/SPB_Fire Station.png"
]

texFilesDict_building["Hos"] = [
	"models/polyModels/Models/SPB_Hospital.obj",
	"models/polyModels/Models/SPB_Hospital.mtl",
	"models/polyModels/Textures/SPB_Hospital.png"
]

texFilesDict_building["School"] = [
	"models/polyModels/Models/SPB_School.obj",
	"models/polyModels/Models/SPB_School.mtl",
	"models/polyModels/Textures/SPB_School.png"
]

texFilesDict_building["Wat"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_13.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_13.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_13_Color01.png"
]

texFilesDict_building["Ind"] = [
	"models/polyModels/Models/SPW_Urban_Factory_Bldg_01.obj",
	"models/polyModels/Models/SPW_Urban_Factory_Bldg_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Factory.png"
]

texFilesDict_building["Com"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_08.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_08.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_08_Color01.png"
]

texFilesDict_building["Shel1"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_01.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_01_Color02.png"];
texFilesDict_building["Shel2"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_01.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_01_Color02.png"];
texFilesDict_building["Shel3"] = [
	"models/polyModels/Models/SPW_Urban_Bldg_01.obj",
	"models/polyModels/Models/SPW_Urban_Bldg_01.mtl",
	"models/polyModels/Textures/SPW_Urban_Bldg_01_Color02.png"];



	texFilesDict_ground["water"] = ["#012e51", "#012e51", "#014b84", "#014b84", "#012e51", "#012e51", "#014b84", "#014b84", "#012e51", "#012e51", "#014b84", "#014b84", "#012e51", "#012e51", "#014b84", "#014b84", "#0168b7", "#0168b7", "#0168b7", "#0168b7"];
	texFilesDict_ground["building"] = ["#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B", "#41472B"];
	texFilesDict_ground["parks"] = ["#031c0b", "#031c0b", "#094a1b", "#094a1b", "#031c0b", "#031c0b", "#094a1b", "#094a1b", "#031c0b", "#031c0b", "#094a1b", "#094a1b", "#031c0b", "#031c0b", "#094a1b", "#094a1b", "#0f772b", "#0f772b", "#0f772b", "#0f772b"];
	texFilesDict_ground["parking_lot"] = ["#27272b", "#27272b", "#71717b", "#71717b", "#27272b", "#27272b", "#71717b", "#71717b", "#27272b", "#27272b", "#71717b", "#71717b", "#27272b", "#27272b", "#71717b", "#71717b", "#c0c0c5", "#c0c0c5", "#c0c0c5", "#c0c0c5"];
	texFilesDict_ground["road"] = ["#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646", "#464646"];

	//texFilesDict_ground["p1"] = ["#091709", "#091709", "#358533", "#358533", "#091709", "#091709", "#358533", "#358533", "#091709", "#091709", "#358533", "#358533", "#091709", "#091709", "#358533", "#358533", "#bae4b9", "#bae4b9", "#bae4b9", "#bae4b9"];
	//texFilesDict_ground["r1"] = ["#8a2f19", "#8a2f19", "#e1755c", "#e1755c", "#8a2f19", "#8a2f19", "#e1755c", "#e1755c", "#8a2f19", "#8a2f19", "#e1755c", "#e1755c", "#8a2f19", "#8a2f19", "#e1755c", "#e1755c", "#f1bfb2", "#f1bfb2", "#f1bfb2", "#f1bfb2"];
	//texFilesDict_ground["y1"] = ["#f9c910", "#f9c910", "#fbda5b", "#fbda5b", "#f9c910", "#f9c910", "#fbda5b", "#fbda5b", "#f9c910", "#f9c910", "#fbda5b", "#fbda5b", "#f9c910", "#f9c910", "#fbda5b", "#fbda5b", "#fdeba6", "#fdeba6", "#fdeba6", "#fdeba6"];
	//texFilesDict_ground["road2"] = ["#a78008", "#a78008", "#d8a50a", "#d8a50a", "#464646", "#464646", "#464646", "#464646", "#a78008", "#a78008", "#d8a50a", "#d8a50a", "#a78008", "#a78008", "#d8a50a", "#d8a50a", "#464646", "#464646", "#464646", "#464646"];
	texFilesDict_flood["flood"] = ["#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#0d79ee", "#0d79ee", "#063b75", "#063b75", "#52a0f6", "#52a0f6", "#52a0f6", "#52a0f6"];
	texFilesDict_groundd["empty"] = ["#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"];

	modelSize["tree"] = 10;
	modelSize["tree2"] = 10;
	modelSize["Res1"] = 15;
	modelSize["Res2"] = 15;
	modelSize["Res3"] = 15;
	modelSize["road_v"] = 8;
	modelSize["road_h"] = 8;
	modelSize["road_c"] = 8;

	modelSize["road_h_left_1"] = 8;
	modelSize["road_h_right_1"] = 8;
	modelSize["road_v_up_1"] = 8;
	modelSize["road_v_down_1"] = 8;

	modelSize["road_left_up_2"] = 8;
	modelSize["road_left_down_2"] = 8;
	modelSize["road_right_up_2"] = 8;
	modelSize["road_right_down_2"] = 8;

	modelSize["road_left_right_up_3"] = 8;
	modelSize["road_left_right_down_3"] = 8;
	modelSize["road_up_down_left_3"] = 8;
	modelSize["road_up_down_right_3"] = 8;


	modelSize["parking"] = 16;
	modelSize["Pol"] = 12;
	modelSize["Fire"] = 12;
	modelSize["Hos"] = 12;
	modelSize["School"] = 16;
	modelSize["Wat"] = 12;
	modelSize["Ind"] = 16;
	modelSize["Com"] = 12;
	modelSize["Shel1"] = 15;
	modelSize["Shel2"] = 15;
	modelSize["Shel3"] = 15;


	modelSize["Bank"] = 10;
	modelSize["Chu"] = 13;
	modelSize["Chse"] = 14;
	modelSize["Htl"] = 12;
	modelSize["Com2"] = 13;
	modelSize["Gas"] = 13;
	modelSize["Hll"] = 13;




	meshDict = {};
	meshDictIndex = {};

	for (name of Object.keys(texFilesDict_building)){
		if (isInstancing(name)){
			meshDict[name] = returnInstancedMeshModel(
				texFilesDict_building[name][0], texFilesDict_building[name][1], texFilesDict_building[name][2], countMap[name] + 50, modelSize[name], name);
			meshDict[name].name = name;
			meshDictIndex[name] = [0, []];

		};
	};

	for (name of Object.keys(texFilesDict_ground)){
		meshDict[name] = returnInstancedMesh(
			1, texFilesDict_ground[name], countMap[name] + 50);
		meshDict[name].name = name;
		meshDictIndex[name] = [0, []];
	};

	for (name of Object.keys(texFilesDict_groundd)){
		meshDict[name] = returnInstancedMesh(
			1, texFilesDict_groundd[name], 3000);
		meshDict[name].name = name;
		meshDictIndex[name] = [0, []];
	};


	for (name of Object.keys(texFilesDict_flood)){

		meshDict[name] = returnInstancedMesh(2, texFilesDict_flood[name], countMap[name] + 50);
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
	
	//geometry.rotateY(45 * THREE.Math.DEG2RAD);

	var mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.matrixAutoUpdate = false;
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
};


function returnInstancedMeshModel(obj, mtl, tex, count, divide, name){

	var geometry, material, mesh, divide;

	//divide = 15;

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
			if (name == "road_h"){
				geometry.rotateY(-90 * THREE.Math.DEG2RAD);
			}
			else if (name == "road_left_down_2"){
				geometry.rotateY(-90 * THREE.Math.DEG2RAD);
			}

			else if (name == "road_left_up_2"){
				geometry.rotateY(-180 * THREE.Math.DEG2RAD);
			}

			else if (name == "road_right_up_2"){
				geometry.rotateY(-270 * THREE.Math.DEG2RAD);
			}
			else if (name == "road_left_right_down_3"){
				geometry.rotateY(-90 * THREE.Math.DEG2RAD);
			}
			else if (name == "road_up_down_left_3"){
				geometry.rotateY(-180 * THREE.Math.DEG2RAD);
			}
			else if (name == "road_left_right_up_3"){
				geometry.rotateY(-270 * THREE.Math.DEG2RAD);
			}
			else if (name == "road_h_left_1"){
				geometry.rotateY(-90 * THREE.Math.DEG2RAD);
			}

			else if (name == "road_v_up_1"){
				geometry.rotateY(-180 * THREE.Math.DEG2RAD);
			}

			else if (name == "road_h_right_1"){
				geometry.rotateY(-270 * THREE.Math.DEG2RAD);
			}
			else{
				
			}


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


function isInstancing(name){
    /*
        if object is added to scene with non-instancing method, returns false.
    */
    if (name == "Res1" || name == "Res2" || name == "Res3" || name == "Hos" || name == "School" || name == "Pol" || name == "Com" || name == "Fire"){
        return false;
    };
    return true;
};
