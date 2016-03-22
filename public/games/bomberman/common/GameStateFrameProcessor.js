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
		constructor(gameConfig, gameState, playerInputStates) {
			this.gameConfig = gameConfig;
			this.gameState = gameState;
			this.playerInputStates = playerInputStates;
			this.frameNumber = 0;
			this.frameNumberMax = 10000;
		}

		// This represents one server frame, e.g. 15 fps ==> 15 frames per second to all clients
		// Will change the current game state (model) according to parameters from the game config and dt
		// @param dt Time passed since processing last frame
		// @return What, if anything?
		processSnapshot(dt) {
			
			// Process each player movement
			var v = this.gameConfig.game.playerSpeed;
			forEach.call(this, this.gameState.getPlayers(), function(p, i) {
				var playerInputState = this.playerInputStates[i];
				var ds = Math.round(v * (dt/1000)); // how much has the player moved since last frame
				if (playerInputState.getKeyUp()) {
					p.setMoving(true);
					p.setOrientation(CONST.PLAYER_ORIENTATION.BACK);
					p.move(0, ds*-1);
				}
				if (playerInputState.getKeyLeft()) {
					p.setMoving(true);
					p.setOrientation(CONST.PLAYER_ORIENTATION.SIDE_LEFT);
					p.move(ds*-1, 0);
				}
				if (playerInputState.getKeyDown()) {
					p.setMoving(true);
					p.setOrientation(CONST.PLAYER_ORIENTATION.FRONT);
					p.move(0, ds*1);
				}
				if (playerInputState.getKeyRight()) {
					p.setMoving(true);
					p.setOrientation(CONST.PLAYER_ORIENTATION.SIDE_RIGHT);
					p.move(ds*1, 0);
				}
				if (!playerInputState.keyW && !playerInputState.keyA && !playerInputState.keyS && !playerInputState.keyD) {
					// Stop moving
					p.setMoving(false);
				}
			}); 
			this.incrementFrameNumber();
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