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
	this.isQuitButtonEnabled = ko.observable(true);
	this.wsConnectionStatus = ko.observable(false);
	this.gameConfig = ko.observable(window.gameConfig);
	this.gameTitle = ko.computed(function() {
		return this.gameConfig() !== undefined ?
			this.gameConfig().title :
			null
	}, this);
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
			var data = JSON.parse(e.data);
			console.log("Received ws message:");
			console.log(data);
			switch (data.messageType) {
				case "playerJoined":
					console.log("playerJoined")
					break;
				case "playerLeft":
					console.log("playerLeft");
					break;
				case "message": 
					console.log("message");
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