var fs = require("fs");
var sha1 = require("sha1");
var Common = require("../public/common/common");


var ConManager = function() {
	var lobbyConnections = [];

	this.addLobbyConnection = function(con) {
		// TODO: Check if maxPlayers is reached
		lobbyConnections.push(con);
	};
	this.removeLobbyConnection = function(con) {
		for (var i=0; i<lobbyConnections.length;i++) {
			if (con.ws === lobbyConnections[i].ws) {
				lobbyConnections.splice(i, 1);
				return true;
			}
		}
		return false;
	};
	this.broadcastLobbyMessage = function(message) {
		for (i=0;i<lobbyConnections.length;i++) 
			lobbyConnections[i].ws.send(message);
	};
	this.isValidPlayerID = function(playerID) {
		for (i=0;i<lobbyConnections.length;i++) {
			if (lobbyConnections[i].playerID === playerID) {
				return false;
			}
		}
		return true;
	};
	this.getPlayerCount = function() {
		var count = 0;
		for (var i=0;i<lobbyConnections.length;i++) {
			if (lobbyConnections[i].connectionType === Common.CONNECTION_TYPES.PLAYER) {
				count++;
			}
		}
		return count;
	};
}

var Game = function(gameID, gameConfig) {
	this.gameID = gameID;
	this.gameConfig = gameConfig;
	this.isStarted = false;
	this.conManager = new ConManager();
}

var GameManager = (function() {
	console.log("============== Init GameManager... ==============");

	var games = {};

	function loadConfigFile() {
		var contents = fs.readFileSync("public/games/config.json");
		contents = JSON.parse(contents);
		console.log("Loaded " + contents.length + " games.");
		console.log(contents);
		return contents;
	}

	// Return a gameID
	function createGame(gameName) {
		console.log("============== Creating new " + gameName + " game... ==============");
		var gameConfig = findGameConfig(gameName);
		// If no gameConfig found return null
		if (gameConfig === null) {
			console.log("No gameConfig with name=" + gameName + " found");
			return null;
		}

		var gameID = createGameID();;
		var newGame = new Game(gameID, gameConfig);
		games[gameID] = newGame;
		console.log("Created new game with gameID=" + gameID);
		return gameID;		
	}

	// Creates a hash as a new gameID
	function createGameID() {
		// TODO: Make sure to create gameID that doesn't exist yet
		var gameID = generateGameID();
		while (isValidGameID(gameID) === true) {
			gameID = generateGameID();
		}
		return gameID;
	}
	function generateGameID() {
		return sha1(Math.random()).substring(0, 4).toUpperCase();
	}

	function getGameByID(gameID) {
		return games[gameID];
	}

	function isValidGameID(gameID) {
		return games[gameID] !== undefined;
	}
	function isValidPlayerID(gameID, playerID) {
		if (!isValidGameID(gameID)) 
			return false;
		var game = games[gameID];
		return game.conManager.isValidPlayerID(playerID);
	}

	// Find gameConfig belonging to gameName
	function findGameConfig(gameName) {
		for (var i=0; i<module.config.length;i++) {
			if (module.config[i].name === gameName)
				return module.config[i];
		}
		return null;
	}

	// Attempts to close a game (return false if game started)
	function closeGame(gameID) {
		console.log("============== Closing game " + gameID + "... ==============");
		var game = games[gameID];
		if (game === undefined) {
			return undefined;
		}
		if (game.isStarted === true) { // Don't close a game already started
			return false;
		}
		else {
			// TODO: Kick all players connected to lobby
			console.log("Closed game with gameID=" + gameID);
			delete games[gameID];
			return true;
		}
	}

	function createTestGame(gameID) {
		var gameConfig = module.config[0]; 
		var newGame = new Game(gameID, gameConfig);
		games[gameID] = newGame;
	}

	var module = {};
	module.config = loadConfigFile();
	module.createGame = createGame;
	module.createTestGame = createTestGame;
	module.closeGame = closeGame;
	module.isValidGameID = isValidGameID;
	module.isValidPlayerID = isValidPlayerID;
	module.getGameByID = getGameByID;

	return module;
})();

GameManager.createTestGame("0000");

module.exports = GameManager;