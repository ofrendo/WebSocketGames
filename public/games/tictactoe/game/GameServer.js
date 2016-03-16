var Common = require("../../../common/common");
var playerID_AI = "_AI_";

// TicTacToe game
function GameServer(gameID, playerIDs) {
	console.log("============== Starting GameServer for TicTacToe ==============");
	var self = this;

	this.game = null;
	this.playerIDs = playerIDs;
	if (this.playerIDs.length === 0) this.playerIDs = ["DefaultPlayerID"];
	log("Allowed players: " + this.playerIDs);
	this.connectedPlayerIDs = [];
	this.broadcastMessage = function() { log("broadcastMessage not set") };
	this.isRunning = false;

	// Fields is an array of 9 strings (playerIDs)
	var state = {};
	state.playerSymbols = {};
	state.fields = [];
	state.turn = null; // String representing whose turn it is. playerID for 2 player game, playerID or "_AI_" for 1 player vs AI game
	var ai = null;

	function init() {
		log("Initializing...");	
		// Init fields
		state.fields = [];
		for (var i=0;i<9;i++) {
			state.fields.push(null);
		}

		if (self.playerIDs.length === 2) {
			// PvP
		}
		else {
			ai = new TTT_AI();
			// AI player is needed
			state.turn = Math.random() > 0.5 ?
				self.playerIDs[0] :
				playerID_AI;

			if (state.turn === playerID_AI) {
				ai.doMove(state, self.onMove);
			}

			state.playerSymbols = getRandomPlayerSymbols(self.playerIDs[0], playerID_AI);
		}
		// Send init state to players
		self.broadcastMessage({
			messageType: Common.MESSAGE_TYPES.TTT_INIT,
			state: state
		});
	}
	function getRandomPlayerSymbols(playerID1, playerID2) {
		var result = {};
		if (Math.random() > 0.5) {
			result.playerX = playerID1;
			result.playerO = playerID2;
		}
		else {
			result.playerX = playerID2;
			result.playerO = playerID1;
		}
		return result;
	}
	function getPlayerSymbol(playerID) {
		if (state.playerSymbols.playerX === playerID) {
			return "X";
		}
		else {
			return "O";
		}
	}

	function getNotConnectedPlayers() {
		var result = [];
		for (var i=0;i<self.playerIDs.length;i++) {
			var exists = false;
			for (var j=0;j<self.connectedPlayerIDs.length;j++) {
				if (self.connectedPlayerIDs[j] === self.playerIDs[i])
					exists = true;
			}
			if (exists === false) 
				result.push(self.playerIDs[i]);
		}
		return result;
	}

	this.onPlayerJoin = function(playerID) {
		// Check if all players have joined
		self.connectedPlayerIDs.push(playerID);
		log(playerID + " has joined.");
		var notConnectedPlayers = getNotConnectedPlayers();
		if (notConnectedPlayers.length === 0) {
			log("All players have joined.");
			run();
		}
		else {
			log("Waiting for people: ");
			for (var i=0;i<notConnectedPlayers.length;i++) {
				console.log(notConnectedPlayers[i]);
			}
		}
	};

	this.onPlayerLeave = function(playerID) {
		// Todo: pause
		//console.log("GameServer: " + playerID + " has left.");
	}

	function run() {
		if (this.isRunning === true) 
			return false;
		init();
		log("Running game.");
		this.isRunning = true;
	}
	function isRunning() {
		return this.isRunning;
	}

	this.onMove = function(m) {
		if (isValidMove(m.playerID, m.value)) {
			doMove(m.playerID, m.value);
			self.broadcastMessage({
				messageType: Common.MESSAGE_TYPES.TTT_STATE,
				state: state
			});
			log("Player " + m.playerID + " made a move: " + m.value);
		}
	};

	function isValidMove(playerID, i) {
		return isRunning() &&
			state.turn === playerID &&
			state.fields[i] === null;		   
	}
	function doMove(playerID, i) {
		state.fields[i] = getPlayerSymbol(playerID);
		state.turn = toggleTurn(state.turn);

		if (state.turn === playerID_AI && self.playerIDs.length === 1) {
			// AI needs to make next move
			ai.doMove(state, self.onMove);
		}
	}

	function toggleTurn(turn) {
		if (self.playerIDs.length === 2) {
			// pvp, other player's turn
			return turn === self.playerIDs[0] ?
				self.playerIDs[1] :
				self.playerIDs[0];
		} 
		else {
			return turn === playerID_AI ?
				self.playerIDs[0] :
				playerID_AI;
		}
	}

	function log(m) {
		console.log(gameID + " GameServer" + ": " + m);
	}
};

function TTT_AI() {

	var delay = 1000;

	// Makes callback with i=0...8
	this.doMove = function(state, callback) {
		setTimeout(function() {
			for (var i = 0;i<state.fields.length;i++) {
				if (state.fields[i] === null)
					callback({
						playerID: playerID_AI,
						value: i
					});
			}
		}, delay);
	};

}

module.exports = GameServer;


