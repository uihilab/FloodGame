export function createTiles(){


	var groundTiles, surfaceTiles;

	var tileSize = 100;
	var numberOfTiles = 10000;
	var numberOfTiles_X = Math.pow(numberOfTiles, 0.5)
	var side_length = numberOfTiles_X * tileSize;
	var elevationGround = 100;

	var pos_of_objects = [];

	groundTiles = [];
	surfaceTiles = [];

	for (var row = 0; row < numberOfTiles_X; row++){
		groundTiles.push([]);
		surfaceTiles.push([]);
		for (var column = 0; column < numberOfTiles_X; column++){
			groundTiles[row].push(0);
			surfaceTiles[row].push(0);
		}
	}

	//Water groundTiles
	for (var row = 0; row < numberOfTiles_X; row++){
		for (var column = 0; column < 20; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(98, 100),
				"w1",
				row * 100 + column)
		}
	}

	for (var row = 40; row < 60; row++){
		for (var column = 20; column < numberOfTiles_X; column++){
			groundTiles[row][column]= new groundTile(
				row,
				column,
				getRandomArbitrary(98, 100),
				"w1",
				row * 100 + column)
		}
	}
	
	// Concrete groundTiles
	for (var row = 0; row < 40; row++){
		for (var column = 55; column < 65; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(98, 100),
				"c1",
				row * 100 + column)
		}
	}

	for (var row = 60; row < numberOfTiles_X; row++){
		for (var column = 55; column < 65; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(98, 100),
				"c1",
				row * 100 + column)
		}
	}

	for (var row = 75; row < 85; row++){
		for (var column = 20; column < 55; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(98, 100),
				"c1",
				row * 100 + column)
		}
	}

	//grass groundTiles
	for (var row = 0; row < 40; row++){
		for (var column = 20; column < 55; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(95, 100),
				"g1",
				row * 100 + column)
		}
	}

	for (var row = 0; row < 40; row++){
		for (var column = 65; column < numberOfTiles_X; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(95, 100),
				"g1",
				row * 100 + column)
		}
	}

	for (var row = 60; row < numberOfTiles_X; row++){
		for (var column = 65; column < numberOfTiles_X; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(95, 100),
				"g1",
				row * 100 + column)
		}
	}

	for (var row = 60; row < 75; row++){
		for (var column = 20; column < 55; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(80, 100),
				"g1",
				row * 100 + column)
		}
	}

	for (var row = 85; row < numberOfTiles_X; row++){
		for (var column = 20; column < 55; column++){
			groundTiles[row][column] = new groundTile(
				row,
				column,
				getRandomArbitrary(80, 100),
				"g1",
				row * 100 + column)
		}
	}

	// SurfaceTiles

	for (var row = 2; row < 40; row += 6){
		for (var column = 20; column < 55; column += 8){
			pos_of_objects.push([row, column])
			surfaceTiles[row][column] = new surfaceTile(
				row,
				column,
				6,
				100,
				groundTiles[row][column].elevation,
				"b1",
				0)
		}
	};

	for (var row = 2; row < 40; row += 10){
		for (var column = 65; column < numberOfTiles_X; column += 20){

			pos_of_objects.push([row, column])
			surfaceTiles[row][column] = new surfaceTile(
				row,
				column,
				6,
				100,
				groundTiles[row][column].elevation,
				"s1",
				0)
		}
	}

	for (var row = 60; row < numberOfTiles_X; row += 10){
		for (var column = 65; column < numberOfTiles_X; column += 20){
			pos_of_objects.push([row, column])
			surfaceTiles[row][column] = new surfaceTile(
				row,
				column,
				6,
				100,
				groundTiles[row][column].elevation,
				"l1",
				0)
		}
	}

	for (var row = 60; row < 75; row += 10){
		for (var column = 20; column < 55; column += 10){
			pos_of_objects.push([row, column])
			surfaceTiles[row][column] = new surfaceTile(
				row,
				column,
				6,
				100,
				groundTiles[row][column].elevation,
				"b2",
				0)
		}
	}

	for (var row = 85; row < numberOfTiles_X; row += 10){
		for (var column = 20; column < 55; column += 10){
			pos_of_objects.push([row, column])
			surfaceTiles[row][column] = new surfaceTile(
				row,
				column,
				6,
				100,
				groundTiles[row][column].elevation,
				"b3",
				0)
		}
	}


	return [groundTiles, surfaceTiles, pos_of_objects];

};


function getRandomArbitrary(min=80, max=120) {
	return Math.random() * (max - min) + min;
};


function groundTile (row, column, elevation, type, instanceId){
	this.row  = row;
	this.column = column;
	this.elevation = elevation;
	this.type = type;
	this.instanceId = instanceId;
};

function surfaceTile(row, column, size, height, elevation, type, instanceId){
	this.row  = row;
	this.column = column;
	this.elevation = elevation;
	this.type = type;
	this.instanceId = instanceId;
	this.height = height;
	this.size = size;
};