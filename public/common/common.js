(function(exports){

	exports.PARAM_NAME_CONNECTION_TYPES = "connectionType";
	exports.PARAM_NAME_PLAYER_ID = "playerID";

	exports.CONNECTION_TYPES = {
		PLAYER: "player",
		HOST: "host"
	};

	exports.MESSAGE_TYPES = {
		// Lobby messages
		PLAYER_JOINED: "playerJoined",
		PLAYER_LEFT: "playerLeft",
		CHAT_MESSAGE: "chatMessage",

		// Switching to game
		GAME_STARTING: "gameStarting",
		GAME_STARTED: "gameStarted"

		// During game
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