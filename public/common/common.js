(function(exports){

	exports.PARAM_NAME_CONNECTION_TYPES = "connectionType";
	exports.PARAM_NAME_PLAYER_ID = "playerID";

	exports.CONNECTION_TYPES = {
		PLAYER: "player",
		HOST: "host",
		VIEWER: "viewer"
	};

	exports.MESSAGE_TYPES = {
		// Common
		PING: "ping",

		// Lobby messages
		PLAYER_JOINED: "playerJoined",
		PLAYER_LEFT: "playerLeft",
		CHAT_MESSAGE: "chatMessage",

		// Switching to game
		GAME_STARTING: "gameStarting",
		GAME_STARTED: "gameStarted",
		WAITING_FOR: "waitingFor",

		// During game
		// TicTacToe
		TTT_INIT: "ttt_init",
		TTT_STATE: "ttt_state",
		TTT_MOVE: "ttt_move"

	};

	exports.LOBBY_CONST = {
		GAME_STARTING_DELAY: 5
	};





	exports.isValidClientID = function(clientID) {
		return clientID.length >= 4 && clientID.length <= 20;
	};



})(typeof exports === 'undefined' ? 
	this['Common']={} : 
	exports);