function LobbyClient() {
	var self = this;

	// Join lobby
	this.playerID = ko.observable("DefaultClientID");
	this.gameID = ko.observable("0000");
	this.isActiveRequest = ko.observable(false);
	this.isJoinButtonEnabled = ko.computed(function() {
		if (this.gameID() == null || this.playerID() == null) 
			return false;
		if (this.playerID().length >= 4 && this.gameID().length == 4 && this.isActiveRequest() == false)
			return true;
		return false;
	}, this);

	this.joinLobby = function() {
		console.log("============== Joining lobby for " + self.gameID() + " as " + self.playerID() + " ==============");
		self.isActiveRequest(true);

		$.ajax({
			method: "HEAD",
			url: "/join/" + self.gameID() + "/" + self.playerID(),
			success: function(response) {
				console.log("Game ID " + self.gameID() + " with playerID " + self.playerID() + " is valid. Redirecting to lobby...");
				window.location.href = "/join/" + self.gameID() + "/" + self.playerID();
			}, 
			error: function(jqXHR) {
				if (jqXHR.status === 404) {
					console.log("Game with gameID " + self.gameID() + " is invalid.");
				}
				else if (jqXHR.status === 409) {
					console.log("playerID " + self.playerID() + " already exists in gameID " + self.gameID());
				}
			},
			complete: function(jqXHR, textStatus) {
				
				self.isActiveRequest(false);
			}
		});
	}

	// In active lobby
	this.players = ko.observableArray([]);
	this.isQuitButtonEnabled = ko.observable(true);
	this.gameConfig = ko.observable(window.gameConfig);
	this.gameTitle = ko.computed(function() {
		return this.gameConfig() !== undefined ?
			this.gameConfig().title :
			null
	}, this);
	this.gameStarted = ko.observable(false);
	this.gameStartingDelay = ko.observable(Common.LOBBY_CONST.GAME_STARTING_DELAY);
	this.wsConnectionStatus = ko.observable(false);
	this.ws = null;


	function onPageLoad() {
		if (window.gameID !== undefined && window.playerID !== undefined) {
			self.gameID(window.gameID);
			self.playerID(window.playerID);
			console.log("============== Init page with gameID " + self.gameID() + " and playerID " + self.playerID() + " ==============");
			openWSConnection(gameID, playerID);
		}
	}
	onPageLoad();
	//self.isLobbyActive(true);
				//self.gameID(response);
	this.onPageUnload = function() {
		self.ws.close();
	};

	function openWSConnection(gameID, playerID) {
		var host = "ws://" + location.hostname + ":3001/ws/" + gameID + "/lobby?" + 
					Common.PARAM_NAME_CONNECTION_TYPES + "=" + Common.CONNECTION_TYPES.PLAYER + "&" +
					Common.PARAM_NAME_PLAYER_ID + "=" + playerID;

		self.ws = new WebSocket(host);
		self.ws.onopen = function(e) {
			console.log("Lobby WS connection opened.");
			self.wsConnectionStatus(true);
		}
		self.ws.onmessage = function(e) {
			console.log("Lobby WS message received: " + e.data);
			var data = JSON.parse(e.data);
			switch (data.messageType) {
				case Common.MESSAGE_TYPES.PLAYER_JOINED:
					console.log("Player joined lobby.");
					self.players(data.players);
					break;
				case Common.MESSAGE_TYPES.PLAYER_LEFT:
					console.log("Player left lobby.");
					self.players(data.players);
					break;
				case Common.MESSAGE_TYPES.CHAT_MESSAGE: 
					console.log("Chat message not implemented yet: " + data.chatMessage);
					break;
				case Common.MESSAGE_TYPES.GAME_STARTING:
					console.log("Game starting in " + data.remainingDelay + "...");
					self.gameStartingDelay(data.remainingDelay);
					break;
				case Common.MESSAGE_TYPES.GAME_STARTED: 
					var host = 
					console.log("Game has started. Redirecting...");
					window.location.href = "/play/" + self.gameID() + "/" + self.playerID();
					break;
			}
		};
		self.ws.onclose = function(e) {
			console.log("Lobby ws connection closed.");
			console.log(e);
			self.wsConnectionStatus(false);
		};
		//onerror
	}

}

var LobbyClient = new LobbyClient();
window.onbeforeunload = LobbyClient.onPageUnload;

ko.applyBindings(LobbyClient);