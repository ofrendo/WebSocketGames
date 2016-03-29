"use strict"; 

(function(exports){
	var CONST = {
		PLAYER_ORIENTATION: {
			FRONT: 0, 
			SIDE_LEFT: 1, //Looking left
			SIDE_RIGHT: 2, //Looking right
			BACK: 3,
		},
		PLAYER_ORIENTATION_PATH: {
			// Texture paths
			FRONT: "Bomberman/Front/Bman_F_f0",
			SIDE_LEFT: "Bomberman/Side/Bman_F_f0",
			SIDE_RIGHT: "Bomberman/Side/Bman_F_f0",
			BACK: "Bomberman/Back/Bman_B_f0"
		},
		ENTITY_TYPES: {
			EMPTY: 0,
			BLOCK: 1,
			DESTROYABLE_BLOCK: 2,
			BOMB: 3,
			POWER_UP: 4, // each power up type has its own
			PLAYER: 99
		},
		ENTITY_PATHS: {
			EMPTY_PATH: "Blocks/BackgroundTile.png",
			BLOCK_PATH: "Blocks/SolidBlock.png",
			DESTROYABLE_BLOCK_PATH: "Blocks/ExplodableBlock.png",
			//BOMB_PATH: "Bomb/Bomb_f01.png"
			POWERUP_MORE_BOMBS: "NOT IMPLEMENTED"
		},
		CONTROLLER: {
			ARROW_PATH: "/games/bomberman/res/Controller/arrow.png"
		},
		DIRECTION: {
			UP: 0,
			LEFT: 1,
			RIGHT: 2,
			DOWN: 3
		}
	}

	// This is the PRIMARY model
	// This is the model: should NOT know anything about view
	// x, y positions are discrete units of positions in the game state. The position x,y represents the center of an entity (not upper left!)
	class GameState {
		constructor(gameConfig) {
			this.players = [];
			//this.permEntities = GameState.buildPermEntities(gameConfig); // used for not sending these in network frames
			//this.tempEntities = []; // used for sending temporary objects
			this.entities = []; // is one dimensional array. For each tile you have either null or an entity

			this.gameConfig = gameConfig;
			GameState.gameConfig = gameConfig;
		}

		addPlayer(player) {
			this.players.push(player);
		}
		getPlayers() {
			return this.players;
		}
		addEntity(e) {
			this.entities.push(e);
		}
		getEntities() {
			return this.entities;
		}

		//cycle through all entities to check if this move is OK
		// @param player The player who wants to move
		// @param dx x value the player wants to move by
		// @param dy y value the player wants to move by
		isValidPlayerMove(player, dx, dy) {
			var result = true;
			forEach.call(this, this.getEntities(), function(e, i) {
				if (e.getType() === CONST.ENTITY_TYPES.EMPTY) 
					return;
				if (result === true && this.isCollision(
						player.getPositionX()+dx, 
						player.getPositionY()+dy, 
						player.getSize(),
						e.getPositionX(), 
						e.getPositionY(), 
						e.getSize(), player, e)
					 === true) {
					result = false;

				}
			});
			return result;
		}

		// returns what (all entites) is colliding on which side to the player
		// making it possible to move "out" of the bomb but not inside it
		isCollision(e1x, e1y, e1size, e2x, e2y, e2size) {
			//x,y is the center of the entities
			var dx = Math.abs(e1x - e2x);
			var dy = Math.abs(e1y - e2y);
			var minDist = e1size/2+e2size/2;
			//console.log("e1x=" + e1x + " e2x=" + e2x + " dx=" + dx + " dy=" + dy + " e=" + e.getPositionX() + "," + e.getPositionY() + " p=" + p.getPositionX() + "," + p.getPositionY() + " mindist=" + minDist);
				
			if (dx < minDist && dy < minDist) {
				return true;
			}
			else {
				//console.log(dy);
				return false;
			}

		}

		isValidPlayerBomb(player) {
			return player.getBombsLeft() > 0 && // does player have any bombs left
				this.isValidPlayerMove(player, 0, 0); // is it a valid spot: does it collide with any other bombs?
				// meaning player can't put a bomb where there is already a bomb
		}
		placeBomb(player) {
			//player.incrementBombsCurrent();
			// Round to a proper tile position: find corresponding field
			var roundedPosition = GameState.roundToRealPosition(player.getPosition(), this.gameConfig.game.tileSize);
			//console.log(roundedPosition); 
			var tilePosition = GameState.toTilePosition(roundedPosition, this.gameConfig.game.tileSize);
			var i = GameState.fromTilePositionToIndex(tilePosition, this.gameConfig.game.xTiles);
			//console.log(i);
			var bomb = new Bomb(roundedPosition.x, roundedPosition.y, player);
		}			

		static getStartPositions(nPlayers, xTiles, yTiles, tileSize) {
			var result = [];
			if (nPlayers < 5) {
				result = [
					{ // upper left
						x: tileSize*1.5, 
						y: tileSize*1.5
					},
					{ // upper right
						x: tileSize*xTiles - 1.5*tileSize,
						y: tileSize*1.5
					},
					{ // bottom right
						x: tileSize*xTiles - 1.5*tileSize,
						y: tileSize*yTiles - 1.5*tileSize
					},
					{ // bottom left
						x: tileSize*1.5, 
						y: tileSize*yTiles - 1.5*tileSize
					}
				];
				result.splice(nPlayers, 4-nPlayers);
			}
			else if (nPlayers < 9) {

			}
			else {

			}
			return result;
		}	

		// Manhattan distance, not euclidean
		// distances in tiles, not in local/real world
		static getMinDistanceFromStartPositions(startPositions, tileSize, x, y) {
			var result;
			forEach(startPositions, function(position) {
				var tilePosition = GameState.toTilePosition(position, tileSize);
				var dist = Math.abs(tilePosition.x - x) + Math.abs(tilePosition.y - y);
				if (result === undefined || result > dist) 
					result = dist;
			});
			return result;
		}

		static roundToRealPosition(position, tileSize) {
			return {
				x: tileSize * Math.floor(position.x/tileSize) + 0.5*tileSize,
				y: tileSize * Math.floor(position.y/tileSize) + 0.5*tileSize
			};
		}
		// converts {x: 75, y: 75} to {x: 1, y: 1} with a tilesize of 50
		static toTilePosition(position, tileSize) {
			return {
				x: (position.x - tileSize/2) / tileSize,
				y: (position.y - tileSize/2) / tileSize
			};
		}
		static fromTilePosition(position, tileSize) {
			return {
				x: (position.x+0.5)*tileSize,
				y: (position.y+0.5)*tileSize
			};
		}
		static fromIndexToTilePosition(i, xTiles) {
			return {
				x: i % xTiles,
				y: Math.floor(i / xTiles)
			};
		}
		static fromTilePositionToIndex(position, xTiles) {
			return position.y * xTiles + position.x;
		}

		static buildRandomGameState(gameConfig) {
			var result = new GameState(gameConfig);

			var xTiles = gameConfig.game.xTiles;
			var yTiles = gameConfig.game.yTiles;
			var tileSize = gameConfig.game.tileSize;

			var nPlayers = gameConfig.game.nPlayers;

			// Players
			var startPositions = GameState.getStartPositions(nPlayers, xTiles, xTiles, tileSize);
			for (var i=0;i<nPlayers;i++) {
				var position = startPositions[i];
				var player = new Player(position.x, position.y);
				result.addPlayer(player);
			}
			// tiles
			for (var y=0; y<yTiles; y++) {
				for (var x=0; x<xTiles;x++) {
					var position = GameState.fromTilePosition({x: x, y:y}, tileSize);
					if (x === 0 || // PERMANENT BLOCKS: upper row
						y === 0 || // left column
						x === xTiles-1 || // bottom row
						y === yTiles-1 || // right column
					    (x % 2 === 0 && y % 2 === 0)) { // inner blocks

						var block = new Block(position.x, position.y);
						result.addEntity(block);

					}
					else if (Math.random() > 0.5 &&  // Destroyable blocks
						GameState.getMinDistanceFromStartPositions(startPositions, tileSize, x, y) > 1) {

						var destroyableBlock = new DestroyableBlock(position.x, position.y);
						result.addEntity(destroyableBlock);
					}
					else {
						var empty = new EmptyEntity(position.x, position.y);
						result.addEntity(empty);
					}
					//else if (Math.random() > 0.75) { // only add a bomb sometimes
					//	continue;
					//}
					//var destroyableBlock = new DestroyableBlock(x*tileSize+tileSize/2, y*tileSize+tileSize/2);
					//result.addTempEntity(destroyableBlock);

				}
			}


			return result;
		}

		buildNetworkFrame() {
			var result = [this.getPlayers().length];
			forEach(this.getPlayers(), function(p) {
				result.push(p.x);
				result.push(p.y);
				result.push(p.orientation);
				result.push(p.moving);
			});

			// Encode fields as one long string
			var encodedEntities = "";
			forEach(this.getEntities(), function(e) {
				encodedEntities += e.getType();
			});
			result.push(encodedEntities);

			/*forEach(this.getTempEntities(), function(e) {
				result.push(e.getType());
				result.push(e.x);
				result.push(e.y);
			});*/	
			return result;
		}

		playoutFrame(networkFrame) {
			//console.log(networkFrame);
			forEach(this.getPlayers(), function(p, i) {
				p.setPosition(networkFrame[i*4 +0], networkFrame[i*4 +1]);
				p.setOrientation(networkFrame[i*4 +2]);
				p.setMoving(networkFrame[i*4 +3]);
			});
		}
		// TODO: Better: use an integer "counter" as a pointer
		static buildFromNetworkFrame(gameState, gameConfig, networkFrame) {
			var nPlayers = networkFrame[0];
			networkFrame.splice(0, 1);
			//console.log(networkFrame);
			//console.log("nPlayers=" + nPlayers);

			// Create player objects
			for (var i=0; i<nPlayers; i++) {// 4 properties of a player being sent atm
				var player = new Player(networkFrame[i*4+0], networkFrame[i*4+1]);
				player.setOrientation(networkFrame[i*4+2]);
				player.setMoving(networkFrame[i*4+3]);
				gameState.addPlayer(player);
				//console.log("added player");
				//console.log(player);
			}
			networkFrame.splice(0, nPlayers*4);

			// Create entites
			//console.log(networkFrame);
			var encodedEntities = networkFrame[0];
			for (var i=0;i<encodedEntities.length;i++) {
				var type = parseInt(encodedEntities.charAt(i));
				var position = GameState.fromIndexToTilePosition(i, gameConfig.game.xTiles);
				position = GameState.fromTilePosition(position, gameConfig.game.tileSize);
				var entity = Entity.buildEntity(
					type,
					position.x,
					position.y 
				)
				gameState.addEntity(entity);
			}
			//console.log("players: " + gameState.getPlayers().length);
			//console.log("entities: " + gameState.getEntities().length);
		}
	}

	

	// Each entity covers a rectangle
	// x,y represents the center if the entity
	class Entity {
		constructor(x, y) {
			this.x = x;
			this.y = y;
		}
		getType() {
			throw new Error("abstract method getType not overriden");
		}

		setPosition(x, y) {
			this.x = x;
			this.y = y;
		}
		move(dX, dY) {
			this.x += dX;
			this.y += dY;
		}
		getPositionX() {
			return this.x; 
		}
		getPositionY() {
			return this.y; 
		}
		getPosition() {
			return {
				x: this.x,
				y: this.y
			};
		}

		getSize() {
			return GameState.gameConfig.game.tileSize;
		}

		static buildEntity(type, x, y) {
			switch (type) {
				case CONST.ENTITY_TYPES.EMPTY: 
					return new EmptyEntity(x, y);
				case CONST.ENTITY_TYPES.BLOCK: 
					return new Block(x, y);
				case CONST.ENTITY_TYPES.DESTROYABLE_BLOCK: 
					return new DestroyableBlock(x, y);
				case CONST.ENTITY_TYPES.BOMB:
					return new Bomb(x, y);
				case CONST.ENTITY_TYPES.POWER_UP:
					return new PowerUp(x, y);
			}
		}
	}

	class Player extends Entity {
		constructor(x, y) {
			// States
			super(x, y);
			this.orientation = CONST.PLAYER_ORIENTATION.FRONT;
			this.orientationChanged = true; // Set to true initially so texture is drawn
			this.orientationOld = null; // Use to remove texture of old orientation
			this.moving = false; // This is only used for animation, NOT for calculating position
			this.movingChanged = false;

			this.bombsMax = 1;
			this.bombsCurrent = 0;
		}

		incrementBombsMax() {
			this.bombsMax++;
		}
		decrementBombsCurrent() {
			this.bombsCurrent--;
		}
		incrementBombsCurrent() {
			this.bombsCurrent++;
		}
		getBombsLeft() {
			return this.bombsMax - this.bombsCurrent;
		}

		setMoving(moving) {
			if (this.moving !== moving) {
				this.moving = moving;
				this.movingChanged = true;
			}
		}
		setOrientation(orientation) {
			//if (orientation > 3) throw new Error("Error with orientation");
			//if (orientation === false) throw new Error("Error with orientation");
			if (this.orientation !== orientation) {
				this.orientationOld = this.orientation; // Set old so old texture can be removed
				this.orientation = orientation;
				this.orientationChanged = true;
			}
		}

		// override
		getSize() {
			return GameState.gameConfig.game.playerSize;
		}
	}
	class EmptyEntity extends Entity {
		constructor(x, y) {
			super(x, y);
		}
		getType() {
			return CONST.ENTITY_TYPES.EMPTY;
		}
	}
	class Block extends Entity {
		constructor(x, y) {
			super(x, y);
		}
		getType() {
			return CONST.ENTITY_TYPES.BLOCK;
		}
	}
	class DestroyableBlock extends Entity {
		getType() {
			return CONST.ENTITY_TYPES.DESTROYABLE_BLOCK;
		}

	}
	class Bomb extends Entity {
		constructor(x, y, playerOwner) { // who set the bomb?
			super(x, y);
			this.playerOwner = playerOwner;
		}
		getType() {
			return CONST.ENTITY_TYPES.BOMB;
		}
	}
	class PowerUp extends Entity {
		// has a powerup "stored" now already or afterwards
		getType() {
			return CONST.ENTITY_TYPES.POWER_UP;
		}
	}

	GameState.CONST = CONST;
	GameState.Player = Player;

	exports.GameState = GameState;

	function forEach(a, callback) {
		for (var i=0;i<a.length;i++) {
			callback.call(this, a[i], i);
		}
	}

})(typeof exports === 'undefined' ? 
	//this['GameState']={} : 
	window :
	exports);