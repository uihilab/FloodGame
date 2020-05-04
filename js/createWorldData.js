export function createTiles(){


	var groundTiles, surfaceTiles;

	var tileSize = 10;
	var numberOfTiles = 400;
	var numberOfTiles_X = Math.pow(numberOfTiles, 0.5)
	var side_length = numberOfTiles_X * tileSize;
	var elevationGround = 10;

	groundTiles = [];

	for (var i = 0; i < numberOfTiles_X; i++){
		groundTiles.push([]);
		for (var j = 0; j < numberOfTiles_X; j++){
			groundTiles[i].push[0]
		}
	}

	//Water groundTiles
	for (var i = 0; i < numberOfTiles_X; i++){
		// groundTiles.push([])
		for (var j = 0; j < 4; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"water",
				i * 100 + j)
		}
	}

	for (var i = 8; i < 12; i++){
		//groundTiles.push([])
		for (var j = 4; j < numberOfTiles_X; j++){
			groundTiles[j][i]= new groundTile(
				i,
				j,
				elevationGround,
				"water",
				i * 100 + j)
		}
	}
	


	// Concrete groundTiles
	for (var i = 0; i < 8; i++){
		//groundTiles.push([])
		for (var j = 11; j < 13; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"concrete",
				i * 100 + j)
		}
	}


	for (var i = 12; i < numberOfTiles_X; i++){
		//groundTiles.push([])
		for (var j = 11; j < 13; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"concrete",
				i * 100 + j)
		}
	}

	for (var i = 15; i < 17; i++){
		//groundTiles.push([])
		for (var j = 4; j < 11; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"concrete",
				i * 100 + j)
		}
	}


	//grass groundTiles

	for (var i = 0; i < 8; i++){
		//groundTiles.push([])
		for (var j = 4; j < 11; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"grassFlat",
				i * 100 + j)
		}
	}

	for (var i = 0; i < 8; i++){
		for (var j = 13; j < numberOfTiles_X; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"grassFlat",
				i * 100 + j)
		}
	}

	for (var i = 12; i < numberOfTiles_X; i++){
		for (var j = 13; j < numberOfTiles_X; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"grassFlat",
				i * 100 + j)
		}
	}

	for (var i = 12; i < 15; i++){
		for (var j = 4; j < 11; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"grassFlat",
				i * 100 + j)
		}
	}

	for (var i = 17; i < numberOfTiles_X; i++){
		for (var j = 4; j < 11; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"grassFlat",
				i * 100 + j)
		}
	}


	for (var i = numberOfTiles_X * 0.2; i < numberOfTiles_X; i++){
		for (var j = numberOfTiles_X * 0.2; j < numberOfTiles_X; j++){
			groundTiles[j][i] = new groundTile(
				i,
				j,
				elevationGround,
				"grassFlat",
				i * 100 + j)
		}
	}

	return groundTiles

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