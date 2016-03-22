var WS_PORT = 3001;
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: WS_PORT });

var GameManager = require("./GameManager");
var Common = require("../public/common/common");

var WSManager = (function() {

	function init(wss) {
		// WS paths: 
		// /ws/:gameID/lobby (connectionType=host or connectionType=player&playerID=abcd)
		// /ws/:gameID/game (connectionType=viewer or connectionType=player&playerID=abcd)
		wss.on('connection', function(ws) {
			var wsUrl = ws.upgradeReq.url;
			console.log("WSManager: New ws connection: " + wsUrl);

			var gameID = getGameID(wsUrl);
			if (!GameManager.isValidGameID(gameID)) {
				ws.close(1, "Invalid game ID.");
				return;
			}

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
				var playerID = getParameterByName(Common.PARAM_NAME_PLAYER_ID, wsUrl);
				if (!conManager.isValidPlayerID(playerID)) {
					ws.close(1, "Player with playerID " + playerID + " already exists.");
				}

				// Notify conManager for game
				con.playerID = playerID;
				// TODO: Check if playerID already exists
				conManager.addPlayerConnection(con);

				// Send broadcast message that player has joined
				onPlayerJoin(conManager, gameID, playerID);
				break;
			case Common.CONNECTION_TYPES.HOST: 
				// On host join
				conManager.addOtherConnection(con);
				console.log("Host for " + gameID + " joined.");
				break;
		}

		ws.on('message', function(message) {
	    	//wss.broadcast(message);
		});
		ws.on('close', function(e) {
			conManager.removeConnection(con);
			switch (connectionType) {
				case Common.CONNECTION_TYPES.PLAYER: 
					// Send broadcast message that player has left
					onPlayerJoin(conManager, gameID, playerID);
					break;
				case Common.CONNECTION_TYPES.HOST: 
					console.log("Host for " + gameID + " left.");
					break;
			}
			console.log("Connections: " + conManager.getConnectionCount());
		});

		console.log("Connections: " + conManager.getConnectionCount());
	}

	function handleGameWS(ws, wsUrl, gameID) {
		if (!GameManager.isValidGameID(gameID)) {
			ws.close(1, "Invalid game ID.");
			return;
		}
		var connectionType = getParameterByName(Common.PARAM_NAME_CONNECTION_TYPES, wsUrl);
		var game = GameManager.getGameByID(gameID);
		switch (connectionType) {
			case Common.CONNECTION_TYPES.VIEWER: 
				handleGameWSViewer(ws, game, gameID);
				break;
			case Common.CONNECTION_TYPES.PLAYER: 
				var playerID = getParameterByName(Common.PARAM_NAME_PLAYER_ID, wsUrl);
				handleGameWSPlayer(ws, game, gameID, playerID)
				break;
			
		}
	}
	function handleGameWSViewer(ws, game, gameID) {
		console.log("WSManager: Viewer for " + gameID + " joined.");
		var con = {
			ws: ws,
			connectionType: Common.CONNECTION_TYPES.VIEWER
		}
		game.conManager.addOtherConnection(con);

		ws.on('close', function(e) {
			game.conManager.removeConnection(con);
			console.log("WSManager: Viewer for " + gameID + " left.");
		});
	}	

	function handleGameWSPlayer(ws, game, gameID, playerID) {
		if (!game.conManager.isValidPlayerID(playerID)) {
			ws.close(1008, "Player with playerID " + playerID + " already exists.");
			return;
		}
		if (game.conManager.getGameServer() === null) {
			ws.close(1008, "Game server not started yet, try refreshing.");
		}
		else if (!game.conManager.getGameServer().isValidPlayerID(playerID)) {
			ws.close(1008, "Player with playerID " +playerID + " not allowed.");
			return;
		}


		var con = {
			ws: ws,
			connectionType: Common.CONNECTION_TYPES.PLAYER,
			playerID: playerID
		};

		// Send broadcast message that player has joined
		onPlayerJoin(game.conManager, gameID, playerID);
		game.conManager.addPlayerConnection(con);

		ws.on('message', function(message) {
	    	// Redirect message to game server
	    	//console.log(message);
	    	if (message.startsWith("{") === false) {
	    		game.conManager.getGameServer().onPlayerMessage(message, playerID);
	    	}
	    	else {
	    		var m = JSON.parse(message);
		    	switch(m.messageType) {
		    		case Common.MESSAGE_TYPES.PING:
		    			ws.send(JSON.stringify({
		    				messageType: Common.MESSAGE_TYPES.PONG
		    			}));
		    			break;
		    		default: 
		    			game.conManager.getGameServer().onPlayerMessage(m, playerID);
		    			break;
		    	}
	    	}


		});
		ws.on('close', function(e) {
			game.conManager.removeConnection(con);
			onPlayerLeave(game.conManager, gameID, playerID);
		});
	}
	function onPlayerJoin(conManager, gameID, playerID) {
		var m = JSON.stringify({
			messageType: Common.MESSAGE_TYPES.PLAYER_JOINED,
			playerCount: conManager.getPlayerCount(),
			players: conManager.getPlayers()
		});
		conManager.broadcastMessage(m);
		console.log("WSManager: Player " + playerID + " for " + gameID + " joined.");
	}
	function onPlayerLeave(conManager, gameID, playerID) {
		var m = JSON.stringify({
			messageType: Common.MESSAGE_TYPES.PLAYER_LEFT,
			playerCount: conManager.getPlayerCount(),
			players: conManager.getPlayers()
		});
		conManager.broadcastMessage(m);
		console.log("WSManager: Player " + playerID + " for " + gameID + " left.");
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