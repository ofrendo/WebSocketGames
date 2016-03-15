var WS_PORT = 3001;
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: WS_PORT });

var GameManager = require("./GameManager");
var Common = require("../public/common/common");

var WSManager = (function() {

	function init(wss) {
		// WS paths: 
		// /ws/:gameID/lobby (connectionType=host or connectionType=player&playerID=abcd)
		// /ws/:gameID/game (dunno yet)
		wss.on('connection', function(ws) {
			var wsUrl = ws.upgradeReq.url;
			console.log("WSManager: New ws connection: " + wsUrl);
			var gameID = getGameID(wsUrl);
			var wsHandler = getWSHandler(wsUrl);
			wsHandler(ws, wsUrl, gameID);
		});
	}

	function getGameID(wsUrl) {
		return wsUrl.substring(4, 8);
	}

	function getWSHandler(wsUrl) {
		return wsUrl.substring(9, 14) === "lobby" ? 
			handleLobbyWS :
			handleGameWS;
	}

	function handleLobbyWS(ws, wsUrl, gameID) {
		var connectionType = getParameterByName(Common.PARAM_NAME_CONNECTION_TYPES, wsUrl);
		var game = GameManager.getGameByID(gameID);
		var conManager = game.conManager;
		var con = {
			ws: ws,
			connectionType: connectionType
		};

		switch (connectionType) {
			case Common.CONNECTION_TYPES.PLAYER: 
				// On player join: broadcast to all in this lobby
				con.playerID = getParameterByName("playerID", wsUrl);
				conManager.broadcastLobbyMessage("playerID " + con.playerID + " has joined. Current player count: " + (conManager.getPlayerCount()+1));
				break;
			case Common.CONNECTION_TYPES.HOST: 
				// On host join
				console.log("Host for " + gameID + " joined.");
				break;
		}

		conManager.addLobbyConnection(con);

		ws.on('message', function(message) {
	    	//wss.broadcast(message);
		});
		ws.on('close', function(e) {
			conManager.removeLobbyConnection(con);
			conManager.broadcastLobbyMessage("current player count: " + conManager.getPlayerCount());
		});

	}


	function handleGameWS() {
		// TODO
	}

	var module = {};
	module.init = init;
	module.handleLobbyWS = handleLobbyWS;
	module.handleGameWS = handleGameWS;

	return module;
})();

WSManager.init(wss);

console.log("Listening for WS connections on " + WS_PORT + "...");


// see http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    //url = url.toLowerCase(); // This is just to avoid case sensitiveness  
    name = name.replace(/[\[\]]/g, "\\$&");//.toLowerCase();// This is just to avoid case sensitiveness for query parameter name
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


module.exports = WSManager;