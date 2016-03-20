"use strict";

var Common = require("./common.js");

class GameServer {
	log(m) {
		console.log(this.gameID + " GameServer: " + m);
	}

	constructor(gameID, playerIDs, gameConfig) {

		console.log("============== Starting GameServer for " + gameConfig.title + " ==============");
		// Player connection handling
		this.gameConfig = gameConfig;
		this.gameID = gameID;
		this.playerIDs = playerIDs;
		if (this.playerIDs.length === 0) 
			this.playerIDs = ["DefaultPlayerID"];
		this.log("Allowed players: " + this.playerIDs);

		this.connectedPlayerIDs = [];

		// Game state handling
		this.initialized = false;
		this.running = false;
		
	}

	isInitialized() {
		return this.initialized === true;
	}
	isRunning() {
		return this.running === true;
	}
	run() {
		if (this.isRunning() === true)
			return false;
		if (this.isInitialized() === false) {
			this.init();
			this.initialized = true;
		}

		this.log("Game running.");
		this.running = true;
	}
	stop() {
		this.running = false;
	}

	getNotConnectedPlayers() {
		var result = [];
		for (var i=0;i<this.playerIDs.length;i++) {
			var exists = false;
			for (var j=0;j<this.connectedPlayerIDs.length;j++) {
				if (this.connectedPlayerIDs[j] === this.playerIDs[i])
					exists = true;
			}
			if (exists === false) 
				result.push(this.playerIDs[i]);
		}
		return result;
	}
	isValidPlayerID(playerID) {
		return this.playerIDs.indexOf(playerID) !== -1;
	}
	onPlayerJoin(playerID) {
		// Check if all players have joined
		this.connectedPlayerIDs.push(playerID);
		this.log(playerID + " has joined.");
		var notConnectedPlayers = this.getNotConnectedPlayers();
		if (notConnectedPlayers.length === 0) {
			this.log("All players have joined.");
			this.run();
		}
		else {
			this.log("Waiting for people: ");
			for (var i=0;i<notConnectedPlayers.length;i++) {
				this.log(notConnectedPlayers[i]);
			}
		}
	};

	onPlayerLeave(playerID) {
		// Todo: pause
		this.log(playerID + " has left.");
	}
	// Called from outside: override this
	onPlayerMessage(m) {
		this.log("onPlayerMessage not overriden");
	}
	// Called from inside server
	broadcastMessage(m) {
		if (typeof this.onGameServerBroadcast === "function") {
			this.onGameServerBroadcast(m);
		}
		else {
			this.log("Broadcast message not set!");
		}
	}
	setOnGameServerBroadcast(callback) {
		this.onGameServerBroadcast = callback;
	}
	
}




module.exports.GameServer = GameServer;