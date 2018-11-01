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
		PONG: "pong",

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
		TTT_MOVE: "ttt_move",
		TTT_FINISH: "ttt_finish"

	};

	exports.LOBBY_CONST = {
		GAME_STARTING_DELAY: 5
	};





	exports.isValidClientID = function(clientID) {
		return clientID.length >= 4 && clientID.length <= 20;
	};

	exports.getParameterByName = getParameterByName;


	function getParameterByName(name, url) {
		// see http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	    if (!url) url = window.location.href;
	    //url = url.toLowerCase(); // This is just to avoid case sensitiveness  
	    name = name.replace(/[\[\]]/g, "\\$&");//.toLowerCase();// This is just to avoid case sensitiveness for query parameter name
	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	        results = regex.exec(url);
	    if (!results) return null;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

})(typeof exports === 'undefined' ? 
	this['Common']={} : 
	exports);