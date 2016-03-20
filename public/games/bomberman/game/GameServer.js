"use strict";

// Libraries
var gameloop = require('node-gameloop');

// Own files
var Common = require("../../../common/common");
var CommonBackend = require("../../../common/commonBackend");
var GameState = require("../common/GameState").GameState;
var GameStateFrameProcessor = require("../common/GameStateFrameProcessor").GameStateFrameProcessor;
var PlayerInputState = require("../common/PlayerInputState").PlayerInputState;

class GameServerBomberman extends CommonBackend.GameServer {

	constructor(gameID, playerIDs, gameConfig) {
		super(gameID, playerIDs, gameConfig);

		this.gameState = new GameState();
		this.gameStateFrameProcessor = new GameStateFrameProcessor();
		this.playerInputStates = [];
	}

	// Called when all players have joined
	init() {
		this.log("Initializing Bomberman...");
		// Construct PlayerInputState per player
		forEach.call(this, this.playerIDs, function(playerID, i) {
			var newPlayer = new GameState.Player();
			this.gameState.addPlayer(newPlayer);
			this.playerInputStates[i] = new PlayerInputState();
		});	
	}

	startGameLoop() {
		this.loopID = gameloop.setGameLoop(onGameLoop.bind(this), 1000 / this.gameConfig.server.fps);
	}
	stopGameLoop() {
		gameloop.clearGameLoop(this.loopID);
	}
	onPlayerMessage() {
		
	}

	// Called every fps, with argument delta: time to last calculation
	// This is the server loop
	// Broadcast frame to all connected websockets (players+viewers)
	onGameLoop(dt) {
		this.gameStateFrameProcessor.processSnapshot(dt);
		var networkFrame = this.gameStateFrameProcessor.buildNetworkFrame();
		this.broadcastMessage(networkFrame);
	}

}

function forEach(a, callback) {
	for (var i=0;i<a.length;i++) {
		callback.call(this, a[i], i);
	}
}

module.exports = GameServerBomberman;