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

		this.gameState = GameState.buildRandomGameState(gameConfig);
		this.playerInputStates = [];
		this.gameStateFrameProcessor = new GameStateFrameProcessor(this.gameConfig, this.gameState, this.playerInputStates, this);
		this.gameStateFrameProcessor.setOnGameOver(this.onGameOverGameServer);
	}

	// Called when all players have joined
	init() {
		this.log("Initializing Bomberman...");
		// Construct PlayerInputState per player
		forEach.call(this, this.playerIDs, function(playerID, i) {
			this.playerInputStates[i] = new PlayerInputState(playerID);
			this.log("Added player " + playerID);
		});	

		this.startGameLoop();
	}

	startGameLoop() {
		this.log("Starting game loop...");
		this.loopID = gameloop.setGameLoop(this.onGameLoop.bind(this), 1000 / this.gameConfig.server.fps);
	}
	stopGameLoop() {
		this.log("Stopping game loop...");
		gameloop.clearGameLoop(this.loopID);
	}
	// Called each time a player sends an input
	// ==> Change the corresponding PlayerInputState object
	onPlayerMessage(message, playerID) {
		if (this.isRunning() === true) {
			var playerInputState = this.getPlayerInputState(playerID);
			PlayerInputState.setFromNetworkFrame(playerInputState, message);
		}
	}
	getPlayerInputState(playerID) {
		for (var i = 0; i < this.playerInputStates.length;i++) {
			if (this.playerInputStates[i].playerID === playerID) 
				return this.playerInputStates[i];
		}
		return null;
	}

	// Called every fps, with argument delta: time to last calculation
	// This is the server loop
	// Broadcast frame to all connected websockets (players+viewers)
	onGameLoop(dt) {
		dt *= 1000;
		this.gameStateFrameProcessor.processSnapshot(dt);
		var networkFrame = this.gameStateFrameProcessor.getNetworkFrame();
		this.broadcastMessage(networkFrame);
	}
	onGameOverGameServer() {
		// GameServer: Game is over
		console.log("GameServer: Game is over");
		//console.log(this.onGameOverGameServerCallback);
		//console.log(this);
		if (typeof this.onGameOverGameServerCallback === "function") {
			console.log("GameServer: Calling callback...");
			this.onGameOverGameServerCallback();
		}
		this.stopGameLoop();
	}

}

function forEach(a, callback) {
	for (var i=0;i<a.length;i++) {
		callback.call(this, a[i], i);
	}
}

module.exports = GameServerBomberman;