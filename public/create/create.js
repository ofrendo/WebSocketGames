function Lobby() {
	var self = this;

	// Creating game
	this.isActiveRequest = ko.observable(false);
	this.isCreateButtonEnabled = ko.computed(function() {
		return !this.isActiveRequest();
	}, this);
	this.isLobbyActive = ko.observable(false);

	// In active lobby
	this.gameConfig = ko.observable(null);
	this.gameID = ko.observable(null);
	this.gameTitle = ko.computed(function() {
		return this.gameConfig() !== null ?
			this.gameConfig().title :
			null
	}, this);
	this.gameStarted = ko.observable(false);
	this.gameStartingDelay = ko.observable(Common.LOBBY_CONST.GAME_STARTING_DELAY);
	this.isStartButtonEnabled = ko.computed(function() {
		if (this.gameConfig() === null) 
			return false;
		return this.players().length >= this.gameConfig().lobbyParams.minPlayers &&
			   this.players().length <= this.gameConfig().lobbyParams.maxPlayers &&
			   !this.gameStarted() &&
			   !this.isActiveRequest();
	}, this);
	this.startButtonText = ko.computed(function() {
		return !this.gameStarted() ?
			"Start game" :
			"Starting game in " + this.gameStartingDelay() + "...";
	}, this);
	this.isCloseButtonEnabled = ko.computed(function() {
		return !this.isActiveRequest();
	}, this);
	this.players = ko.observableArray([]);
	this.wsConnectionStatus = ko.observable(false);
	this.ws = null;

	// Receive a gameID from server which we can use to connect to WS
	this.createGame = function(gameName) {
		console.log("============== Creating game for " + gameName + "==============");
		self.isActiveRequest(true);
		$.ajax({
			method: "POST",
			url: "/create/" + gameName,
			success: function(response) {
				console.log("Created new game: ");
				console.log(response);
				self.isLobbyActive(true);
				self.gameConfig(response.gameConfig);
				self.gameID(response.gameID);
				openWSConnection(response.gameID);
			}, 
			//TODO: error
			complete: function(jqXHR, textStatus) {
				self.isActiveRequest(false);
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
					window.location.href = "/view/" + self.gameID();
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

	this.startGame = function() {
		console.log("============== Starting game for gameID " + this.gameID() + "... ==============");
		self.isActiveRequest(true);
		$.ajax({
			method: "POST",
			url: "/start/" + self.gameID(),
			success: function(response) {
				console.log("Game " + self.gameID() + " started.");
				self.gameStarted(true);
			},
			// TODO: error
			complete: function() {
				self.isActiveRequest(false);
			}
		});
	};

	this.closeGame = function() {
		console.log("============== Closing lobby for gameID " + this.gameID() + "... ==============");
		self.isActiveRequest(true);
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
					self.gameConfig(null);
					self.gameID(null);
				}
			},
			complete: function(jqXHR, textStatus) {
				self.isActiveRequest(false);
			}
		});
	};
}


ko.applyBindings(new Lobby());
