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
			state.playerSymbols = getRandomPlayerSymbols(self.playerIDs[0], self.playerIDs[1]);
			state.turn = Math.random() > 0.5 ?
				self.playerIDs[0] :
				self.playerIDs[1];
		}
		else {
			// AI player is needed
			state.playerSymbols = getRandomPlayerSymbols(self.playerIDs[0], playerID_AI);
			var aiPlayerSymbol = state.playerSymbols.playerX === playerID_AI ? "X" : "O";

			state.turn = Math.random() > 0.5 ?
				self.playerIDs[0] :
				playerID_AI;

			var isAIFirst = (state.turn === playerID_AI);
			ai = new TTT_AI(aiPlayerSymbol, isAIFirst);

			if (state.turn === playerID_AI) {
				ai.doMove(state, self.onMove);
			}
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
				log(notConnectedPlayers[i]);
			}
		}
	};

	this.onPlayerLeave = function(playerID) {
		// Todo: pause
		//console.log("GameServer: " + playerID + " has left.");
	}

	function run() {
		if (isRunning() === true) 
			return false;
		init();
		log("Running game.");
		self.isRunning = true;
	}
	function isRunning() {
		return self.isRunning;
	}

	this.onMove = function(m) {
		if (isValidMove(m.playerID, m.value)) {
			doMove(m.playerID, m.value);
			self.broadcastMessage({
				messageType: Common.MESSAGE_TYPES.TTT_STATE,
				state: state
			});
			log("Player " + m.playerID + " made a move: " + m.value);
			var gameOver = checkGameOver(state);
			if (gameOver !== false) {
				self.isRunning = false;
			}
			
			if (state.turn === playerID_AI && self.playerIDs.length === 1 && isRunning() === true) {
				// AI needs to make next move
				ai.doMove(state, self.onMove);
			}
		}
		else {
			log("Player " + m.playerID + " attempted to make invalid move: " + m.value);
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

	// Game over after either win or 9 moves
	function checkGameOver(state) {
		var winResult = getWin(state.fields);
		if (winResult !== false) {
			var playerID = (winResult === "X") ? state.playerSymbols.playerX : state.playerSymbols.playerO;
			self.broadcastMessage({
				messageType: Common.MESSAGE_TYPES.TTT_FINISH,
				state: state,
				winner: playerID
			});
			log("Player " + playerID + " has won the game.");
		}
		else if (getMovesDone(state.fields) === 9) {
			self.broadcastMessage({
				messageType: Common.MESSAGE_TYPES.TTT_FINISH,
				state: state,
				winner: null
			});
			log("Game is a draw.");
			return true;
		}
		return false;
	}

	function getWin(f) {
		var rows = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6]
		];
		for (var i=0;i<rows.length;i++) {
			if (f[rows[i][0]] !== null && f[rows[i][0]] === f[rows[i][1]] && f[rows[i][0]] === f[rows[i][2]]) {
				return f[rows[i][0]];
			}
		}
		return false;
	}

	function log(m) {
		console.log(gameID + " GameServer" + ": " + m);
	}
};

function getMovesDone(f) {
	var count = 0;
	for (var i=0;i<f.length;i++) {
		if (f[i] !== null)
			count++;
	}
	return count;
}

function TTT_AI(playerSymbol, isAIFirst) {

	var self = this;
	this.playerSymbol = playerSymbol;
	//this.isAIFirst = isAIFirst;

	var delay = 500;

	// Makes callback with i=0...8
	this.doMove = function(state, callback) {
		var nextMoveIndex = getNextMoveWinnable(state);
		if (nextMoveIndex === -1) {
			nextMoveIndex = getNextMoveIndex(state);
		}
		else {
		}

		setTimeout(function() {
			callback({
				playerID: playerID_AI,
				value: nextMoveIndex
			});
		}, delay);
	};

	function getNextMoveIndex(state) {
		var movesDone = getMovesDone(state.fields);
		var isAIFirst = (movesDone % 2 === 0);
		if (isAIFirst) {
			if (movesDone === 0) { 
				// Play in middle
				return 4;
			}
			if (movesDone === 2) { 
				// Played in middle, play in a corner
				// Check if player played in corner: if yes play on opposite side (zwickmühle)
				var playedCorner = getPlayedCorner(state.fields);
				if (playedCorner >= 0) {
					return getOppositeCorner(playedCorner);
				}
				else {
					return getPlayableCorner(state.fields);
				}
			}
			if (movesDone > 2) {
				// All further situations covered by isGameWinnable 
				var playableCorner = getPlayableCorner(state.fields);
				if (playableCorner >= 0) 
					return playableCorner;
				else 
					return getRandomField(state.fields);
			}

		}
		else {
			// player went first
			if (movesDone === 1) {
				if (isMiddlePlayed(state.fields)) {
					return getPlayableCorner(state.fields);
				}
				else {
					return 4;
				}
			}
			if (movesDone > 1) {
				var playableCorner = getPlayableCorner(state.fields);
				if (playableCorner !== -1) 
					return playableCorner;
				else 
					return getRandomField(state.fields);
			}
		}
	}

	function getPlayedCorner(f) {
		if (f[0] !== null) return 0;
		if (f[2] !== null) return 2;
		if (f[6] !== null) return 6;
		if (f[8] !== null) return 8;
		return -1;
	}
	function isMiddlePlayed(f) {
		return (f[4] === null) ? false : true;
	}
	function getOppositeCorner(i) {
		if (i === 0) return 8;
		if (i === 2) return 6;
		if (i === 6) return 2;
		if (i === 8) return 0;
		return -1;
	}

	function getPlayableCorner(f) {
		var corners = [];
		if (f[0] === null) corners.push(0);
		if (f[2] === null) corners.push(2);
		if (f[6] === null) corners.push(6);
		if (f[8] === null) corners.push(8);
		return corners.length > 0 ? getRandomArrayElem(corners) : -1;
	}
	function getRandomField(f) {
		for (var i=0;i<f.length;i++) {
			if (f[i] === null) return i;
		}
		return -1;
	}

	function getRandomArrayElem(a) {
		return a[Math.floor(Math.random()*a.length)];
	}

	function getNextMoveWinnable(state) {
		var f = state.fields;
		var rows = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6]
		];
		for (var i=0;i<rows.length;i++) {
			var index = getIndexRowWinnable(f, rows[i][0], rows[i][1], rows[i][2]);
			if (index >= 0) {
				return index;
			}
		}
		return -1;
	}
	function getIndexRowWinnable(f, i1, i2, i3) {
		if (f[i1] === null && f[i2] !== null && f[i2] === f[i3]) {
			return i1;
		}
		if (f[i2] === null && f[i1] !== null && f[i1] === f[i3]) {
			return i2;
		}
		if (f[i3] === null && f[i1] !== null && f[i1] === f[i2]) {
			return i3;
		}
		return -1;
	}

}

module.exports = GameServer;


