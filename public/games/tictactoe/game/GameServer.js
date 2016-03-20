"use strict";

var Common = require("../../../common/common");
var CommonBackend = require("../../../common/commonBackend");
var playerID_AI = "_AI_";

// TicTacToe game
class GameServerTicTacToe extends CommonBackend.GameServer {

	constructor(gameID, playerIDs, gameConfig) {
		super(gameID, playerIDs, gameConfig);
		
		// Fields is an array of 9 strings "X" "O" or null
		this.state = {};
		this.state.playerSymbols = {};
		this.state.fields = [];
		this.state.turn = null; // String representing whose turn it is. playerID for 2 player game, playerID or "_AI_" for 1 player vs AI game
		this.ai = null;

		
	}

	// Call this when all players have joined
	init() {
		this.log("Initializing...");	

		// Init fields
		this.state.fields = [];
		for (var i=0;i<9;i++) {
			this.state.fields.push(null);
		}

		if (this.playerIDs.length === 2) {
			// PvP
			this.state.playerSymbols = getRandomPlayerSymbols(this.playerIDs[0], this.playerIDs[1]);
			this.state.turn = Math.random() > 0.5 ?
				this.playerIDs[0] :
				this.playerIDs[1];
		}
		else {
			// AI player is needed
			this.state.playerSymbols = this.getRandomPlayerSymbols(this.playerIDs[0], playerID_AI);
			var aiPlayerSymbol = this.state.playerSymbols.playerX === playerID_AI ? "X" : "O";

			this.state.turn = Math.random() > 0.5 ?
				this.playerIDs[0] :
				playerID_AI;

			var isAIFirst = (this.state.turn === playerID_AI);
			this.ai = new TTT_AI(aiPlayerSymbol, isAIFirst);

			if (this.state.turn === playerID_AI) {
				var self = this;
				this.ai.doMove(this.state, this.onMove.bind(self));
			}
		}
		// Send init state to players
		this.broadcastMessage({
			messageType: Common.MESSAGE_TYPES.TTT_INIT,
			state: this.state
		});
	}

	getRandomPlayerSymbols(playerID1, playerID2) {
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

	getPlayerSymbol(playerID) {
		if (this.state.playerSymbols.playerX === playerID) {
			return "X";
		}
		else {
			return "O";
		}
	}
	onPlayerMessage(m) {
		this.onMove(m);
	}
	onMove(m) {
		if (this.isValidMove(m.playerID, m.value)) {
			this.doMove(m.playerID, m.value);
			this.broadcastMessage({
				messageType: Common.MESSAGE_TYPES.TTT_STATE,
				state: this.state
			});
			this.log("Player " + m.playerID + " made a move: " + m.value);
			var gameOver = this.checkGameOver();
			if (gameOver !== false) {
				this.stop();
			}
			
			if (this.state.turn === playerID_AI && this.playerIDs.length === 1 && this.isRunning() === true) {
				// AI needs to make next move
				this.ai.doMove(this.state, this.onMove.bind(this));
			}
		}
		else {
			this.log("Player " + m.playerID + " attempted to make invalid move: " + m.value);
		}
	};

	isValidMove(playerID, i) {
		return this.isRunning() &&
			this.state.turn === playerID &&
			this.state.fields[i] === null;		   
	}
	doMove(playerID, i) {
		this.state.fields[i] = this.getPlayerSymbol(playerID);
		this.state.turn = this.toggleTurn(this.state.turn);
	}
	toggleTurn(turn) {
		if (this.playerIDs.length === 2) {
			// pvp, other player's turn
			return turn === this.playerIDs[0] ?
				this.playerIDs[1] :
				this.playerIDs[0];
		} 
		else {
			return turn === playerID_AI ?
				this.playerIDs[0] :
				playerID_AI;
		}
	}
	// Game over after either win or 9 moves
	checkGameOver() {
		var winResult = this.getWin(this.state.fields);
		if (winResult !== false) {
			var playerID = (winResult === "X") ? 
				this.state.playerSymbols.playerX : 
				this.state.playerSymbols.playerO;
			this.broadcastMessage({
				messageType: Common.MESSAGE_TYPES.TTT_FINISH,
				state: this.state,
				winner: playerID
			});
			this.log("Player " + playerID + " has won the game.");
		}
		else if (getMovesDone(this.state.fields) === 9) {
			this.broadcastMessage({
				messageType: Common.MESSAGE_TYPES.TTT_FINISH,
				state: this.state,
				winner: null
			});
			this.log("Game is a draw.");
			return true;
		}
		return false;
	}
	getWin(f) {
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
	
}


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

module.exports = GameServerTicTacToe;


