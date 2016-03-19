var fs = require("fs");
var sha1 = require("sha1");
var Common = require("../public/common/common");

var gameServers = {};

var ConManager = function() {
	var self = this;

	// con structure
	// con.ws The WebSocket
	// con.connectionType see Common.CONNECTION_TYPES
	// con.playerID if connectionType === Common.CONNECTION_TYPES.PLAYER
	var connections = [];
	this.gameServer = null;

	function addConnection(con) {
		connections.push(con);
	};

	this.addPlayerConnection = function(con) {
		// TODO: Check if maxPlayers is reached
		addConnection(con);
		if (this.isGameServerActive() === true) {
			this.getGameServer().onPlayerJoin(con.playerID);
		}
	};
	this.addOtherConnection = function(con) {
		addConnection(con);
	};
	this.removeConnection = function(con) {
		for (var i=0; i<connections.length;i++) {
			if (con === connections[i]) {
				connections.splice(i, 1);
				if (this.isGameServerActive() === true) {
					this.getGameServer().onPlayerLeave(con.playerID);
				}
				return true;
			}
		}
		return false;
	};
	this.closeAndRemoveAllConnections = function() {
		for (var i=0;i<connections.length;i++) {
			connections[i].ws.close();
		}
		connections = [];
	};
	this.onCloseGame = function() {
		for (var i=0; i<connections.length;i++) {
			connections[i].ws.close();
		}
	};
	this.broadcastMessage = function(message) {
		for (i=0;i<connections.length;i++) 
			connections[i].ws.send(message);
	};
	this.isValidPlayerID = function(playerID) {
		for (i=0;i<connections.length;i++) {
			if (connections[i].playerID === playerID) {
				return false;
			}
		}
		return true;
	};
	this.getPlayerCount = function() {
		var count = 0;
		for (var i=0;i<connections.length;i++) {
			if (connections[i].connectionType === Common.CONNECTION_TYPES.PLAYER) {
				count++;
			}
		}
		return count;
	};
	this.getConnectionCount = function() {
		return connections.length;
	};
	this.getPlayers = function() {
		var result = [];
		for (var i=0;i<connections.length;i++) {
			if (connections[i].connectionType === Common.CONNECTION_TYPES.PLAYER) {
				var player = {
					playerID: connections[i].playerID
				};
				result.push(player);
			}
		}
		return result;
	};
	this.getPlayerIDs = function() {
		var result = [];
		for (var i=0;i<connections.length;i++) {
			if (connections[i].connectionType === Common.CONNECTION_TYPES.PLAYER) {
				result.push(connections[i].playerID);
			}
		}
		return result;
	};
	this.isGameServerActive = function() {
		return !(this.getGameServer() === null);
	}
	this.getGameServer = function() {
		return this.gameServer;
	};
	this.setGameServer = function(gameServer) {
		this.gameServer = gameServer;
		this.gameServer.broadcastMessage = onGameServerBroadcast;
	};

	function onGameServerBroadcast(m) {
		self.broadcastMessage(JSON.stringify(m));
	}
}

var Game = function(gameID, gameConfig) {
	var self = this;
	this.gameID = gameID;
	this.conManager = new ConManager();

	this.getGameConfig = function() {
		return gameConfig;
	};

	var isStarted = false;
	this.isStarted = function() {
		return isStarted;
	};

	this.start = function(delay) {
		// Return false if already started
		if (this.isStarted()) {
			return false;
		}
		isStarted = true;
		// Broadcast starting message with delay
		var countdown = delay || Common.LOBBY_CONST.GAME_STARTING_DELAY;
		var timer = setInterval(function() {
			var m;
			if (countdown !== 0) {
				// Broadcast starting message to all connections
				m = JSON.stringify({
					messageType: Common.MESSAGE_TYPES.GAME_STARTING,
					remainingDelay: countdown
				});
				self.conManager.broadcastMessage(m);
				console.log(self.gameID + " Game starting in " + countdown + "...");
				countdown--;
			}
			else {
				m = JSON.stringify({
					messageType: Common.MESSAGE_TYPES.GAME_STARTED
				});
				self.conManager.broadcastMessage(m);
				clearInterval(timer);
				console.log(self.gameID + " Game started.");

				var gameServer = new gameServers[gameConfig.name](self.gameID, self.conManager.getPlayerIDs());
				self.conManager.setGameServer(gameServer);

				self.conManager.closeAndRemoveAllConnections();
			}
		}, 1000);

		return true;
	};
}

var GameManager = (function() {
	console.log("============== Init GameManager... ==============");

	var games = {};

	function loadConfigFile() {
		var contents = fs.readFileSync("public/games/config.json");
		contents = JSON.parse(contents);
		for (var i=0;i<contents.length;i++) {
			var serverPath = "../public/games/" + contents[i].path + "/game/GameServer.js";
			gameServers[contents[i].name] = require(serverPath);
		}
		console.log("Loaded " + contents.length + " games.");
		console.log(contents);
		return contents;
	}

	// Return a gameID
	function createGame(gameName) {
		console.log("============== Creating new " + gameName + " game... ==============");
		var gameConfig = getGameConfig(gameName);
		// If no gameConfig found return null
		if (gameConfig === null) {
			console.log("No gameConfig with name=" + gameName + " found");
			return null;
		}

		var gameID = createGameID();;
		var newGame = new Game(gameID, gameConfig);
		games[gameID] = newGame;
		console.log("Created new game with gameID=" + gameID);
		return {
			gameConfig: gameConfig,
			gameID: gameID
		};		
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
	function getGameConfig(gameName) {
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
		if (game.isStarted() === true) { // Don't close a game already started
			return false;
		}
		else {
			// TODO: Send proper message when closing lobby to other players
			game.conManager.onCloseGame();
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
	function createTestGameStarted(gameID) {
		var gameConfig = module.config[0];
		var newGame = new Game(gameID, gameConfig);
		games[gameID] = newGame;
		newGame.start(1);
	}

	function startGame(gameID) {
		var game = getGameByID(gameID);
		return game.start();
	}

	var module = {};
	// Config
	module.config = loadConfigFile();
	module.getGameConfig = getGameConfig;

	// Lobby/game
	module.createGame = createGame;
	module.createTestGame = createTestGame;
	module.createTestGameStarted = createTestGameStarted;
	module.closeGame = closeGame;
	module.startGame = startGame;
	module.isValidGameID = isValidGameID;
	module.isValidPlayerID = isValidPlayerID;
	module.getGameByID = getGameByID;

	return module;
})();

GameManager.createTestGame("0000");
GameManager.createTestGameStarted("0001");

module.exports = GameManager;