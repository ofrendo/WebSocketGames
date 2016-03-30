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
			FIRE: 4,
			POWER_UP: 5, // each power up type has its own
			PLAYER: 99
		},
		ENTITY_PATHS: {
			EMPTY_PATH: "Blocks/BackgroundTile.png",
			BLOCK_PATH: "Blocks/SolidBlock.png",
			DESTROYABLE_BLOCK_PATH: "Blocks/ExplodableBlock.png",
			BOMB_PATH: "Bomb/Bomb_f01.png",
			FIRE_PATH: "Flame/Flame_f00.png",
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
			this.bombs = [];
			this.fires = [];

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
		destroyBlock(i) {
			// TODO: Power ups
			var oldE = this.entities[i];
			this.entities[i] = Entity.buildEntity(
				CONST.ENTITY_TYPES.EMPTY,
				oldE.getPositionX(),
				oldE.getPositionY()
			);
		}
		addBomb(bomb) {
			this.bombs.push(bomb);
		}
		removeBomb(bomb) {
			var index = this.getBombs().indexOf(bomb);
			this.bombs.splice(index, 1);
		}
		getBombs() {
			return this.bombs;
		}
		explodeBomb(bomb) {
			var strength = bomb.getStrength();
			var tilesDistance = 1;
			// 1 unit of strength reaches one field
			var up = true; // each boolean is a direction we can continue in
			var down = true;
			var left = true;
			var right = true;
			var tPos = GameState.toTilePosition(bomb.getPosition(), this.gameConfig.game.tileSize);
			var pos = bomb.getPosition();
			var dur = this.gameConfig.game.fireDuration;
			var tileSize = this.gameConfig.game.tileSize;	
			var xTiles = this.gameConfig.game.xTiles;

			// New fire on center
			this.addFire(new Fire(pos.x, pos.y, bomb.playerOwner, dur));

			while (tilesDistance <= strength) {
				if (up === true) {
					var i = GameState.fromTilePositionToIndex({x: tPos.x, y: tPos.y-tilesDistance}, xTiles);
					var e = this.getEntities()[i];
					if (e.getType() === CONST.ENTITY_TYPES.DESTROYABLE_BLOCK) {
						this.destroyBlock(i)
						up = false;
					}
					else if (e.getType() === CONST.ENTITY_TYPES.BLOCK) {
						up = false;
					}
					else {
						this.addFire(new Fire(pos.x, pos.y - tilesDistance*tileSize, bomb.playerOwner, dur));
					}
				}
				if (down === true) {
					var i = GameState.fromTilePositionToIndex({x: tPos.x, y: tPos.y+tilesDistance}, xTiles);
					var e = this.getEntities()[i];
					if (e.getType() === CONST.ENTITY_TYPES.DESTROYABLE_BLOCK) {
						this.destroyBlock(i)
						down = false;
					}
					else if (e.getType() === CONST.ENTITY_TYPES.BLOCK) {
						down = false;
					}
					else {
						this.addFire(new Fire(pos.x, pos.y + tilesDistance*tileSize, bomb.playerOwner, dur));
					}
				}
				if (left === true) {
					var i = GameState.fromTilePositionToIndex({x: tPos.x-tilesDistance, y: tPos.y}, xTiles);
					var e = this.getEntities()[i];
					if (e.getType() === CONST.ENTITY_TYPES.DESTROYABLE_BLOCK) {
						this.destroyBlock(i)
						left = false;
					}
					else if (e.getType() === CONST.ENTITY_TYPES.BLOCK) {
						left = false;
					}
					else {
						this.addFire(new Fire(pos.x-tilesDistance*tileSize, pos.y, bomb.playerOwner, dur));
					}
				}
				if (right === true) {
					var i = GameState.fromTilePositionToIndex({x: tPos.x+tilesDistance, y: tPos.y}, xTiles);
					var e = this.getEntities()[i];
					if (e.getType() === CONST.ENTITY_TYPES.DESTROYABLE_BLOCK) {
						this.destroyBlock(i)
						right = false;
					}
					else if (e.getType() === CONST.ENTITY_TYPES.BLOCK) {
						right = false;
					}
					else {
						this.addFire(new Fire(pos.x+tilesDistance*tileSize, pos.y, bomb.playerOwner, dur));
					}
				}

				tilesDistance++;
			}
			//console.log(pos);
		}
		addFire(fire) {
			this.fires.push(fire);
		}
		removeFire(fire) {
			var index = this.getFires().indexOf(fire);
			this.fires.splice(index, 1);
		}
		getFires() {
			return this.fires;
		}
		isPlayerTouchingFire(p) {
			var fires = this.getFires();
			for (var i=0;i<fires.length;i++) {
				var f = fires[i];
				if (this.isCollision(
						p.getPositionX(),
						p.getPositionY(),
						this.gameConfig.game.playerSize,
						f.getPositionX(),
						f.getPositionY(),
						this.gameConfig.game.tileSize)
					 === true) {
					// Player dead
					return true;
				} 
			}
			return false;
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
			forEach.call(this, this.getBombs(), function(b, i) {
				// Allow to move through bomb only if inside bomb
				if (result === true && this.isCollision(
						player.getPositionX(), 
						player.getPositionY(), 
						player.getSize(),
						b.getPositionX(), 
						b.getPositionY(), 
						b.getSize())
					 === true) {
					// Already inside bomb. Moving out is allowed
				}
				else if (result === true && this.isCollision(
						player.getPositionX()+dx, 
						player.getPositionY()+dy, 
						player.getSize(),
						b.getPositionX(), 
						b.getPositionY(), 
						b.getSize())
					 === true) {

					// Not inside bomb and trying to move into it
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
			// Round to a proper tile position: find corresponding field
			var roundedPosition = GameState.roundToRealPosition(player.getPosition(), this.gameConfig.game.tileSize);
			//console.log(roundedPosition); 
			var tilePosition = GameState.toTilePosition(roundedPosition, this.gameConfig.game.tileSize);
			var i = GameState.fromTilePositionToIndex(tilePosition, this.gameConfig.game.xTiles);
			//console.log(i);
			var bomb = new Bomb(roundedPosition.x, roundedPosition.y, player, this.gameConfig.game.bombDuration);
			player.incrementBombsCurrent();
			this.addBomb(bomb);
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

		static isFreeLineOfSight(p1, p2) {
			if (p1.x !== p2.x && p1.y !== p2.y) // if neither x or y is the same (can't go around corners)
				return false; 

			throw new Error("NOT IMPLEMENTED");
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

		getPlayerIndex(player){
			for (var i=0;i<this.getPlayers().length;i++) {
				if (this.getPlayers()[i] === player) 
					return i;
			}
			return -1;
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

			// Add bombs and fires
			var tempEntities = this.getBombs().concat(this.getFires());
			forEach.call(this, tempEntities, function(e) {
				result.push(e.getType());
				result.push(e.x);
				result.push(e.y);
				result.push(this.getPlayerIndex(e.playerOwner));
				result.push(e.getDurationLeft());
			});

			return result;
		}

		playoutFrame(networkFrame) {
			//console.log(networkFrame);
			var copyNetworkFrame = networkFrame.slice();
			forEach(this.getPlayers(), function(p, i) {
				p.setPosition(copyNetworkFrame[i*4 +0], copyNetworkFrame[i*4 +1]);
				p.setOrientation(copyNetworkFrame[i*4 +2]);
				p.setMoving(copyNetworkFrame[i*4 +3]);
			});
			
			// Remove all data to do with players
			copyNetworkFrame.splice(0, this.getPlayers().length*4);
			if (copyNetworkFrame.length > 0) {
				this.bombs = [];
				this.fires = [];
				// Means this is not an interpolated frame
				var encodedEntities = copyNetworkFrame[0];
				for (var i=0;i<encodedEntities.length;i++) {
					var type = parseInt(encodedEntities.charAt(i));
					if (this.getEntities()[i].getType() !== type) {
						// Means there was a change server side
						//console.log("HERE IN GAME STATE");
						var position = GameState.fromIndexToTilePosition(i, this.gameConfig.game.xTiles);
						position = GameState.fromTilePosition(position, this.gameConfig.game.tileSize);
						this.getEntities()[i] = Entity.buildEntity(
							type,
							position.x,
							position.y 
						);
					}
				}
			}

			// Remove field data
			copyNetworkFrame.splice(0, 1);
			if (copyNetworkFrame.length > 0) {
				// Means there are bombs or fires
				for (var i=0;i<copyNetworkFrame.length/4;i++) {
					var type = copyNetworkFrame[i*5+0];
					var playerIndex = copyNetworkFrame[i*5+3];
					var player = this.getPlayers()[playerIndex];
					switch (type) {
						case CONST.ENTITY_TYPES.BOMB: 
							this.addBomb(new Bomb(
								copyNetworkFrame[i*5+1],
								copyNetworkFrame[i*5+2],
								player,
								copyNetworkFrame[i*5+4]
							));
							break;
						case CONST.ENTITY_TYPES.FIRE: 
							this.addFire(new Fire(
								copyNetworkFrame[i*5+1],
								copyNetworkFrame[i*5+2],
								player,
								copyNetworkFrame[i*5+4]
							));
							break;
					}
				}
				
			}

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

			this.alive = true;

			this.bombsMax = 1;
			this.bombsCurrent = 0;
			this.bombStrength = 1; // how many fields does the bomb reach?
		}

		kill() {
			console.log("Player was killed!");
			this.alive = false;
		}
		isAlive() {
			return this.alive;
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
		incrementBombStrength() {
			this.bombStrengh++;
		}
		getBombStrength() {
			return this.bombStrength;
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

	class TempEntity extends Entity {
		constructor(x, y, playerOwner, durationLeft) {
			super(x, y);
			this.playerOwner = playerOwner; // who is the owner of the bomb/fire?
			this.durationLeft = durationLeft;
		}
		getDurationLeft() {
			return this.durationLeft;
		}
		subtractDurationLeft(dt) {
			this.durationLeft -= dt;
		}
		isDurationOver() {
			return this.durationLeft <= 0;
		}
	}

	class Bomb extends TempEntity {
		constructor(x, y, playerOwner, durationLeft) { 
			super(x, y, playerOwner, durationLeft);
			this.strength = playerOwner.getBombStrength();
		}
		getType() {
			return CONST.ENTITY_TYPES.BOMB;
		}
		getStrength() {
			return this.strength;
		}	
	}
	class Fire extends TempEntity {
		constructor(x, y, playerOwner, durationLeft) {
			super(x, y, playerOwner, durationLeft);
		}
		getType() {
			return CONST.ENTITY_TYPES.FIRE;
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