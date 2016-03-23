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
			BLOCK: 0,
			DESTROYABLE_BLOCK: 1,
			BOMB: 2,
			POWER_UP: 3
		},
		ENTITY_PATHS: {
			BLOCK_PATH: "Blocks/SolidBlock.png",
			DESTROYABLE_BLOCK_PATH: "Blocks/ExplodableBlock.png",
			POWERUP_MORE_BOMBS: "NOT IMPLEMENTED"
		}
	}

	// This is the PRIMARY model
	// This is the model: should NOT know anything about view
	// x, y positions are discrete units of positions in the game state. The position x,y represents the center of an entity (not upper left!)
	class GameState {
		constructor(gameConfig) {
			this.players = [];
			this.permEntities = GameState.buildPermEntities(gameConfig); // used for not sending these in network frames
			this.tempEntities = []; // used for sending temporary objects

			GameState.gameConfig = gameConfig;
		}

		addPlayer(player) {
			this.players.push(player);
		}
		getPlayers() {
			return this.players;
		}
		addPermEntity(entity) {
			this.permEntities.push(entity);
		}
		addTempEntity(entity) {
			this.tempEntities.push(entity);
		}
		getEntities() {
			return this.getPermEntities().concat(this.getTempEntities());
		}
		getPermEntities() {
			return this.permEntities;
		}
		getTempEntities() {
			return this.tempEntities;
		}

		//cycle through all entities to check if this move is OK
		// @param player The player who wants to move
		// @param dx x value the player wants to move by
		// @param dy y value the player wants to move by
		isValidPlayerMove(player, dx, dy) {
			var result = true;
			forEach.call(this, this.getEntities(), function(e, i) {
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
		isCollision(e1x, e1y, e1size, e2x, e2y, e2size, p, e) {
			//x,y is the center of the entities
			var dx = Math.abs(e1x - e2x);
			var dy = Math.abs(e1y - e2y);
			var minDist = e1size/2+e2size/2;

			if (dx < minDist && dy < minDist) {
				//console.log("dx=" + dx + " dy=" + dy + " e=" + e.getPositionX() + "," + e.getPositionY() + " p=" + p.getPositionX() + "," + p.getPositionY() + " mindist=" + minDist);
				return true;
			}
			else {
				//console.log(dy);
				return false;
			}

		}

		// Starting blocks
		static buildPermEntities(gameConfig) {
			var xTiles = gameConfig.game.xTiles;
			var yTiles = gameConfig.game.yTiles;
			var tileSize = gameConfig.game.tileSize;

			var result = [];
			for (var x=0;x<xTiles;x++) {
				for (var y=0;y<yTiles;y++) {

					// Blocks
					if (x === 0 || // upper row
						y === 0 || // left column
						x === xTiles-1 || // bottom row
						y === yTiles-1 || // right column
					    (x % 2 === 0 && y % 2 === 0)) { // inner blocks

						var block = new Block(x*tileSize+tileSize/2, y*tileSize+tileSize/2);
						result.push(block);
					}

				}
			}
			return result;
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
						x: tileSize*xTiles - tileSize/2,
						y: tileSize*1.5
					},
					{ // bottom right
						x: tileSize*xTiles - tileSize/2,
						y: tileSize*yTiles - tileSize/2
					},
					{ // bottom left
						x: tileSize*1.5, 
						y: tileSize*yTiles - tileSize/2
					}
				];
			}
			else if (nPlayers < 9) {

			}
			else {

			}
			return result;
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

			return result;
		}

		buildNetworkFrame() {
			var result = [this.getPlayers().length, this.getTempEntities().length];
			forEach(this.getPlayers(), function(p) {
				result.push(p.x);
				result.push(p.y);
				result.push(p.orientation);
				result.push(p.moving);
			});
			forEach(this.getTempEntities(), function(e) {
				result.push(e.getType());
				result.push(e.x);
				result.push(e.y);
			});	
			return result;
		}

		// TODO: Better: use an integer "counter" as a pointer
		static buildFromNetworkFrame(gameState, networkFrame) {
			var nPlayers = networkFrame[0];
			var nEntities = networkFrame[1];
			//console.log(networkFrame);
			networkFrame.splice(0, 2);
			//console.log(networkFrame);
			//console.log("nPlayers=" + nPlayers);
			//console.log("nEntities=" + nEntities);

			// Create player objects
			for (var i=0; i<nPlayers; i++) {// 4 properties of a player being sent atm
				var player = new Player(networkFrame[i*4+0], networkFrame[i*4+1]);
				player.setOrientation(networkFrame[i*4+2]);
				player.setMoving(networkFrame[i*4+3]);
				gameState.addPlayer(player);
				//console.log("added player");
				//console.log(player);
			}
			// Create entites
			networkFrame.splice(0, nPlayers*4);
			//console.log(networkFrame);
			for (var i=0;i<nEntities;i++) {
				var entity = Entity.buildEntity(
					networkFrame[i*3+0], //type
					networkFrame[i*3+1], // x
					networkFrame[i*3+2] // y
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

		getSize() {
			return GameState.gameConfig.game.tileSize;
		}

		static buildEntity(type, x, y) {
			switch (type) {
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
		}

		setMoving(moving) {
			if (this.moving !== moving) {
				this.moving = moving;
				this.movingChanged = true;
			}
		}
		setOrientation(orientation) {
			//if (orientation > 3) throw new Error("Error with orientation");
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