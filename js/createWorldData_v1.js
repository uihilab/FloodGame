export function createTiles(){


	var groundTiles, surfaceTiles;

	var tileSize = 10;
	var numberOfTiles = 10000;
	var numberOfTiles_X = Math.pow(numberOfTiles, 0.5)
	var side_length = numberOfTiles_X * tileSize;
	var elevationGround = 10;

	var pos_of_objects = [];

	groundTiles = [];
	surfaceTiles = [];

	for (var i = 0; i < numberOfTiles_X; i++){
		groundTiles.push([]);
		surfaceTiles.push([]);
		for (var j = 0; j < numberOfTiles_X; j++){
			groundTiles[i].push(0);
			surfaceTiles[i].push(0);
		}
	}

	//Water groundTiles
	for (var i = 0; i < numberOfTiles_X; i++){
		// groundTiles.push([])
		for (var j = 0; j < 20; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"w1",
				i * 100 + j)
		}
	}

	for (var i = 40; i < 60; i++){
		//groundTiles.push([])
		for (var j = 20; j < numberOfTiles_X; j++){
			groundTiles[j][i]= new groundTile(
				i,
				j,
				elevationGround,
				"w1",
				i * 100 + j)
		}
	}
	
	// Concrete groundTiles
	for (var i = 0; i < 40; i++){
		//groundTiles.push([])
		for (var j = 55; j < 65; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"c1",
				i * 100 + j)
		}
	}

	for (var i = 60; i < numberOfTiles_X; i++){
		//groundTiles.push([])
		for (var j = 55; j < 65; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"c1",
				i * 100 + j)
		}
	}

	for (var i = 75; i < 85; i++){
		//groundTiles.push([])
		for (var j = 20; j < 55; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"c1",
				i * 100 + j)
		}
	}

	//grass groundTiles
	for (var i = 0; i < 40; i++){
		//groundTiles.push([])
		for (var j = 20; j < 55; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"g1",
				i * 100 + j)
		}
	}

	for (var i = 0; i < 40; i++){
		for (var j = 65; j < numberOfTiles_X; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"g1",
				i * 100 + j)
		}
	}

	for (var i = 60; i < numberOfTiles_X; i++){
		for (var j = 65; j < numberOfTiles_X; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"g1",
				i * 100 + j)
		}
	}

	for (var i = 60; i < 75; i++){
		for (var j = 20; j < 55; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"g1",
				i * 100 + j)
		}
	}

	for (var i = 85; i < numberOfTiles_X; i++){
		for (var j = 20; j < 55; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"g1",
				i * 100 + j)
		}
	}

	// SurfaceTiles

	for (var i = 0; i < 40; i += 6){
		//groundTiles.push([])
		for (var j = 20; j < 55; j += 8){
			pos_of_objects.push([j, i])
			surfaceTiles[j][i] = new surfaceTile(
				j,
				i,
				2,
				20,
				10,
				"b1",
				0)
		}
	};

	for (var i = 0; i < 40; i += 10){
		for (var j = 65; j < numberOfTiles_X; j += 20){
			pos_of_objects.push([j, i])
			surfaceTiles[j][i] = new surfaceTile(
				j,
				i,
				6,
				20,
				10,
				"s1",
				0)
		}
	}

	for (var i = 60; i < numberOfTiles_X; i += 10){
		for (var j = 65; j < numberOfTiles_X; j += 20){
			pos_of_objects.push([j, i])
			surfaceTiles[j][i] = new surfaceTile(
				j,
				i,
				6,
				20,
				10,
				"l1",
				0)
		}
	}

	for (var i = 60; i < 75; i += 10){
		for (var j = 20; j < 55; j += 10){
			pos_of_objects.push([j, i])
			surfaceTiles[j][i] = new surfaceTile(
				j,
				i,
				3,
				20,
				10,
				"b2",
				0)
		}
	}

	for (var i = 85; i < numberOfTiles_X; i += 10){
		for (var j = 20; j < 55; j += 10){
			pos_of_objects.push([j, i])
			surfaceTiles[j][i] = new surfaceTile(
				j,
				i,
				3,
				20,
				10,
				"b3",
				0)
		}
	}




	// surfaceTiles[6][2] = new surfaceTile(
	// 						6,
	// 						2,
	// 						5,
	// 						20,
	// 						10,
	// 						"l1",
	// 						0);

	// surfaceTiles[14][13] = new surfaceTile(
	// 						14,
	// 						13,
	// 						5,
	// 						20,
	// 						10,
	// 						"s1",
	// 						0);
	// surfaceTiles[5][12] = new surfaceTile(
	// 						5,
	// 						12,
	// 						2,
	// 						20,
	// 						10,
	// 						"b1",
	// 						0);
	// surfaceTiles[8][12] = new surfaceTile(
	// 						8,
	// 						12,
	// 						3,
	// 						20,
	// 						10,
	// 						"b3",
	// 						0);
	// surfaceTiles[6][17] = new surfaceTile(
	// 						6,
	// 						17,
	// 						3,
	// 						20,
	// 						10,
	// 						"b2",
	// 						0);

	
	var ii;
	for (ii of pos_of_objects){
		var s = surfaceTiles[ii[0]][ii[1]].size
		for (var i = 0; i < s; i++){
			for (var j = 0; j < s; j++){
				if (i + j != 0){
					surfaceTiles[ii[0] + i][ii[1] + j] = 1;
				};
			};
		};
	};
	console.log(groundTiles)
	return [groundTiles, surfaceTiles, pos_of_objects];

}

function groundTile (position_x, position_z, elevation, type, instanceId){
	this.x  = position_x;
	this.z = position_z;
	this.elevation = elevation;
	this.type = type;
	this.instanceId = instanceId;
}

function surfaceTile(position_z, position_x, size, height, elevation, type, instanceId){
	this.x  = position_x;
	this.z = position_z;
	this.elevation = elevation;
	this.type = type;
	this.instanceId = instanceId;
	this.height = height;
	this.size = size;
}