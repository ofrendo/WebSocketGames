"use strict";

var CONST = CONST;
if (typeof require === "function") {
	CONST = require("./GameState").GameState.CONST;
}

(function(exports) {

	//var CONST = CONST;
	//if (typeof require === "function") {
		
	//}
	class GameStateFrameProcessor {

		// @param gameConfig Config of the game, e.g. fps for server, speed of players etc
		// @param gameState see GameState.js
		// @param playerInputStates array of playerInputStates: 
		//		  Index of playerInputState and the corresponding player in gameState.getPlayers() MUST be the same
		constructor(gameConfig, gameState, playerInputStates, gameServer) {
			this.gameConfig = gameConfig;
			this.gameState = gameState;
			//if (playerInputStates.length === 0) throw new Error("PlayerInputStates is 0!");
			this.playerInputStates = playerInputStates;
			this.frameNumber = 0;
			this.frameNumberMax = 10000;

			this.running = true;
			this.gameServer = gameServer;
		}

		setOnGameOver(callback) {
			this.onGameOverCallback = callback;
		}

		// This represents one server frame, e.g. 15 fps ==> 15 frames per second to all clients
		// Will change the current game state (model) according to parameters from the game config and dt
		// @param dt Time passed since processing last frame
		// @return What, if anything?
		processSnapshot(dt) {
			// workaround: if nPlayers-1 are dead, start game anew in 10 seconds
			if (this.running === false) {
				return;
			}

			if (this.gameState.isGameOver() === true && this.running === true) {
				if (typeof this.onGameOverCallback === "function") {
					console.log("GameStateFrameProcessor: Game is over");
					this.onGameOverCallback.call(this.gameServer);
				}
				this.running = false;
			}


			// Process each player movement
			//var v = this.gameConfig.game.playerSpeed;
			forEach.call(this, this.gameState.getPlayers(), function(p, i) {
				if (p.isAlive() === true && this.gameState.isEntityTouchingFire(p) === true) {
					p.kill();
					console.log("Player " + i + " died!");
				}

				if (p.isAlive() === false) {
					return;
				}
				var playerInputState = this.playerInputStates[i];
				this.processPlayerMovement(p, playerInputState, dt);

				// Check if touching powerups
				var touchingPowerUp = this.gameState.isPlayerTouchingPowerUp(p);
				if (touchingPowerUp !== null) {
					this.gameState.playerCollectPowerUp(p, touchingPowerUp);
				}

				// Bombs
				if (playerInputState.getKeyBomb()) {
					if (this.gameState.isValidBombSpot(p)) {
						//console.log("Can put a bomb here");
						this.gameState.placeBomb(p);
					}
					else {
						
					}
				}
			}); 
			
			// Process temp entities
			var removedBombs = [];
			forEach.call(this, this.gameState.getBombs(), function(b) {
				b.subtractDurationLeft(dt);
				if (b.isDurationOver()) {
					this.gameState.explodeBomb(b);
					removedBombs.push(b);
					//console.log("BOMB EXPLODED");
				}
				else if (this.gameState.isEntityTouchingFire(b)) { // chain reaction
					this.gameState.explodeBomb(b); 
					removedBombs.push(b);
				}
			});
			for (var i=0;i<removedBombs.length;i++){
				this.gameState.removeBomb(removedBombs[i]);
				removedBombs[i].playerOwner.decrementBombsCurrent();
			}

			// Process fires
			var removedFires = [];
			forEach.call(this, this.gameState.getFires(), function(f) {
				f.subtractDurationLeft(dt);
				//console.log(f.getDurationLeft());
				if (f.isDurationOver()) {
					removedFires.push(f);

				}
			});
			for (var i=0;i<removedFires.length;i++) {
				this.gameState.removeFire(removedFires[i]);
			}

			this.incrementFrameNumber();
		}
		processPlayerMovement(p, playerInputState, dt) {
			var v = p.getSpeed();
			var ds = Math.round(v * (dt/1000)); // how much has the player moved since last frame
			if (playerInputState.getKeyUp()) {
				p.setMoving(true);
				p.setOrientation(CONST.PLAYER_ORIENTATION.BACK);
				if (this.gameState.isValidPlayerMove(p, 0, -ds)) {
					p.move(0, ds*-1);
				}
			}
			if (playerInputState.getKeyLeft()) {
				p.setMoving(true);
				p.setOrientation(CONST.PLAYER_ORIENTATION.SIDE_LEFT);
				if (this.gameState.isValidPlayerMove(p, -ds, 0)) {
					p.move(ds*-1, 0);
				}
			}
			if (playerInputState.getKeyDown()) {
				p.setMoving(true);
				p.setOrientation(CONST.PLAYER_ORIENTATION.FRONT);
				if (this.gameState.isValidPlayerMove(p, 0, ds)) {
					p.move(0, ds*1);
				}
			}
			if (playerInputState.getKeyRight()) {
				p.setMoving(true);
				p.setOrientation(CONST.PLAYER_ORIENTATION.SIDE_RIGHT);
				if (this.gameState.isValidPlayerMove(p, ds, 0))	{
					p.move(ds*1, 0);
				}
			}
			if (!playerInputState.getKeyUp() && !playerInputState.getKeyLeft() && !playerInputState.getKeyDown() && !playerInputState.getKeyRight()) {
				// Stop moving
				p.setMoving(false);
			}
		}

		incrementFrameNumber() {
			this.frameNumber = (this.frameNumber + 1) % this.frameNumberMax;
		}


		// this what we actually send over the web
		// x, y, orientation, moving per player: what can be x/y though? different resolutions on different machines
		// @return String: Contructs an array as a representation of the current state to send to clients 
		getNetworkFrame() {
			var result = this.gameState.buildNetworkFrame();
			result.push(this.frameNumber);
			//result.push("asldkjaslkdjaslkdjaslkjdalsjdlaskjdlkasjklda");
			// do stuff like rounding numbers
			return JSON.stringify(result);
		}

	}


	exports.GameStateFrameProcessor = GameStateFrameProcessor;

})(typeof exports === 'undefined' ? window : exports);

function forEach(a, callback) {
	for (var i=0;i<a.length;i++) {
		callback.call(this, a[i], i);
	}
}