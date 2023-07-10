export async function createTiles(list_of_files){
	/*
		This function reads external map files
		and creates groundTiles, surfaceTiles arrays
		to represent the world.
	*/

    //console.log(list_of_files);
	var groundTiles, surfaceTiles, surfaceTiles_v2, floodTiles, countMap;

    var numberOfRows = 50;
    var numberOfColumns = 50;

    // groundTiles = await readExternalJSON("maps/GroundTiles.json");
    // surfaceTiles = await readExternalJSON("maps/SurfaceTiles.json");
    // surfaceTiles_v2 = await readExternalJSON("maps/SurfaceTiles_v2.json");
    groundTiles = await readExternalJSON(list_of_files[0]);
    surfaceTiles = await readExternalJSON(list_of_files[1]);
    surfaceTiles_v2 = await readExternalJSON(list_of_files[2]);

    floodTiles = await readExternalJSON("sources/FloodTiles.json");

    countMap = {};

    // Ground Tiles
    countMap["water"] = 50;
    countMap["building"] = 50;
    countMap["road"] = 50;
    countMap["parks"] = 50;
    countMap["parking_lot"] = 50;


    // Surface Tiles v2
    countMap["road_v"] = 100;
    countMap["road_h"] = 100;
    countMap["road_c"] = 5;
    countMap["tree"] = 1000;
    countMap["tree2"] = 1000;
    countMap["parking"] = 20;
    countMap["flood"] = 5000;

    countMap["road_h_left_1"] = 100;
    countMap["road_h_right_1"] = 100;
    countMap["road_v_up_1"] = 100;
    countMap["road_v_down_1"] = 100;

    countMap["road_left_up_2"] = 100;
    countMap["road_left_down_2"] = 100;
    countMap["road_right_up_2"] = 100;
    countMap["road_right_down_2"] = 100;

    countMap["road_left_right_up_3"] = 100;
    countMap["road_left_right_down_3"] = 100;
    countMap["road_up_down_left_3"] = 100;
    countMap["road_up_down_right_3"] = 100;


    // Surface Tiles
    //countMap["Res1"] = 50;
    //countMap["Res2"] = 50;
    //countMap["Res3"] = 50;
    //countMap["Pol"] = 1;
    //countMap["Fire"] = 1;
    //countMap["Hos"] = 1;
    //countMap["School"] = 1;
    countMap["Wat"] = 1;
    countMap["Ind"] = 1;
    //countMap["Com"] = 1;
    countMap["Shel1"] = 3;
    countMap["Shel2"] = 3;
    countMap["Shel3"] = 3;


    countMap["Bank"] = 1;
    countMap["Chu"] = 1;
    countMap["Chse"] = 1;
    countMap["Htl"] = 1;
    countMap["Com2"] = 1;
    countMap["Gas"] = 1;
    countMap["Hll"] = 1;



    for (var row = 0; row < numberOfRows; row++){
        for (var column = 0; column < numberOfColumns; column++){
            
            countMap[groundTiles[row][column]["type"]]++;
            
            if (surfaceTiles[row][column] != 0){
                if (isInstancing(surfaceTiles[row][column]["type"])){
                    countMap[surfaceTiles[row][column]["type"]]++;
                };
            };

            if (surfaceTiles_v2[row][column] != 0){
                if (surfaceTiles_v2[row][column]["type"] == "tree"){countMap[surfaceTiles_v2[row][column]["type"]] += 4}
                else if (surfaceTiles_v2[row][column]["type"] == "tree2"){countMap[surfaceTiles_v2[row][column]["type"]] += 4}
                else if (surfaceTiles_v2[row][column]["type"] == "road_h"){countMap[surfaceTiles_v2[row][column]["type"]] += 2}
                else if (surfaceTiles_v2[row][column]["type"] == "road_v"){countMap[surfaceTiles_v2[row][column]["type"]] += 2}
                else if (surfaceTiles_v2[row][column]["type"] == "road_c"){countMap[surfaceTiles_v2[row][column]["type"]] += 1}
                else if (surfaceTiles_v2[row][column]["type"] == "parking"){countMap[surfaceTiles_v2[row][column]["type"]] += 1}
                else {countMap[surfaceTiles_v2[row][column]["type"]] += 2};
                
            };

            if (floodTiles[row][column] != 0){
                countMap["flood"]++
            };
        };
    };


    return [groundTiles, surfaceTiles, surfaceTiles_v2, floodTiles, countMap];

};


async function readExternalJSON(filepath){
    /*
        This function reads and return the json
        file at given path.
    */

    var data;

    await fetch(filepath)
        .then(response => data = response.json());
    return data;

};

function isInstancing(name){
    /*
        if object is added to scene with non-instancing method, returns false.
    */
    if (name == "Res1" || name == "Res2" || name == "Res3" || name == "Hos" || name == "School" || name == "Pol" || name == "Com" || name == "Fire"){
        return false;
    };
    return true;
};