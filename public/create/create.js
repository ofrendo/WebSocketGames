function Lobby() {
	var self = this;

	// Creating game
	this.isCreateButtonEnabled = ko.observable(true);
	this.isLobbyActive = ko.observable(false);

	// In active lobby
	this.isCloseButtonEnabled = ko.observable(true);
	this.gameID = ko.observable(null);
	this.wsConnectionStatus = ko.observable(false);
	this.ws = null;

	// Receive a gameID from server which we can use to connect to WS
	this.createGame = function(gameName) {
		console.log("============== Creating game for " + gameName + "==============");
		self.isCreateButtonEnabled(false);
		$.ajax({
			method: "POST",
			url: "/create/" + gameName,
			success: function(response) {
				console.log("Received new gameID: " + response);
				self.isLobbyActive(true);
				self.gameID(response);
				openWSConnection(response);
			}, 
			//TODO: error
			complete: function(jqXHR, textStatus) {
				self.isCreateButtonEnabled(true);
			}
		});
	};

	// Open WS connection for the active lobby
	function openWSConnection(gameID) {
		var host = "ws://" + location.hostname + ":3001/ws/" + gameID + "/lobby?" + 
					Common.PARAM_NAME_CONNECTION_TYPES + "=" + Common.CONNECTION_TYPES.HOST;

		self.ws = new WebSocket(host);
		self.ws.onopen = function(e) {
			console.log("Lobby WS connection opened.");
			self.wsConnectionStatus(true);
		}
		self.ws.onmessage = function(e) {
			console.log("Received ws message: " + e.data);
			var data = JSON.parse(e.data);
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
		}
		//onerror
	}

	this.closeGame = function() {
		console.log("============== Closing lobby for gameID " + this.gameID() + "... ==============");
		self.isCloseButtonEnabled(false);
		$.ajax({
			method: "DELETE",
			url: "/create/" + this.gameID(),
			success: function(response) {
				console.log("Closed lobby for gameID: " + self.gameID());
				self.isLobbyActive(false);
				self.gameID(null);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				//TODO: error 401 jqXHR.status returns status code
				if (jqXHR.status === 404) {
					console.log("GameID " + self.gameID() + " not found. Already deleted?");
					self.isLobbyActive(false);
					self.gameID(null);
				}
			},
			complete: function(jqXHR, textStatus) {
				self.isCloseButtonEnabled(true);
			}
		});

	}




}


ko.applyBindings(new Lobby());
