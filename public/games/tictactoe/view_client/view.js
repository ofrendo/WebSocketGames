var TicTacToeGame = (function() {

	var self = this;

	// Graphics stuff
	var spritePath = '/games/tictactoe/res/sprites.json';
	this.loader = PIXI.loader.add("tictactoe", spritePath);
	this.stage = new PIXI.Container();
	this.stage.interactive = true;
	this.renderer = generateRenderer();
	this.buttons = [];
	this.buttonTextures = {};

	function run() {
		self.loader.load(onAssetsLoaded);
	}

	function onAssetsLoaded() {
		//addTitleBar();
		initializeButtonTextures();
		addGameBoard();

		requestAnimationFrame(animate.bind(self));
	}	
	function addTitleBar() {
		var titleBar = PIXI.Sprite.fromImage('TitleBar.png');
		titleBar.position.x = 0;
		titleBar.position.y = 30;

		self.stage.addChild(titleBar);
	}
	function initializeButtonTextures() {
		self.buttonTextures = {
			blank : new PIXI.Texture.fromImage('BlankPiece.png'),
			X     : new PIXI.Texture.fromImage('XPiece.png'),
			O     : new PIXI.Texture.fromImage('OPiece.png')
		}
	}
	function addGameBoard() {
		for (var i=0; i<9;i++) {
			var button = addGridButton(i);
			self.buttons.push(button);
			self.stage.addChild(button);
		}
	}
	function addGridButton(i) {
		var xIndex = i % 3;
		var yIndex = Math.floor(i/3);

		var padding = 5;
		var buttonL = self.w/3 - 2*padding; //buttonLength

		var button = new PIXI.Sprite(self.buttonTextures.blank);

		button.interactive = true;
		button.buttonMode  = true;
		button.width = buttonL;
		button.height = buttonL;
		button.position.x = xIndex * (buttonL + 2*padding) + padding;
		button.position.y = yIndex * (buttonL + 2*padding) + padding;
		button.currentValue = null;
		button.i = i;
		//button.scale.set(2);
		
		button.mousedown = onButtonClicked;
		button.touchstart = onButtonClicked;
		return button;
	}
	function onButtonClicked(event) {
		var button = event.target;
		if (isValidMove(button)) {
			sendMove(button.i);		
			if (navigator.vibrate) {
				navigator.vibrate(500);
			} else {	
				alert("vibrate not supported!");
			}	
		}
	}
	function isValidMove(button) {
		return isMyTurn() === true &&
			   button.currentValue === null;
	}
	function sendMove(i) {
		var m = JSON.stringify({
			playerID: window.playerID,
			messageType: Common.MESSAGE_TYPES.TTT_MOVE,
			value: i
		});
		ticTacToeWrapper.sendWSMessage(m);
	}

	function onWSMessage(m) {
		switch(m.messageType) {
			case Common.MESSAGE_TYPES.TTT_INIT: // Continue with .STATE afterwards
				console.log("Received init message.");
				self.playerSymbol = (m.state.playerSymbols.playerX === window.playerID) ?
					"X" : "O";
			case Common.MESSAGE_TYPES.TTT_STATE:
				self.isMyTurn = (m.state.turn === window.playerID);
				for (var i=0;i<9;i++) {
					if (buttons[i].currentValue !== m.state.fields[i] && m.state.fields[i] !== null) {
						buttons[i].texture = self.buttonTextures[ m.state.fields[i] ];
						buttons[i].theValue = m.state.fields[i];
						buttons[i].interactive = false;
						buttons[i].buttonMode = false;
					}
				}

				break;
		}
	}

	function animate() {
		this.renderer.render(this.stage);
		fpsMeter.tick();
		requestAnimationFrame(animate.bind(this));
	}	


	// Game stuff
	var state = null;
	this.playerSymbol = null; //either "X" or "O"
	this.isMyTurn = null;

	function isMyTurn() {
		return self.isMyTurn === true;
	}

	var module = {};
	module.run = run;
	module.onWSMessage = onWSMessage;

	return module;
	
	

	
	
	
	// Dont need these
	Game.prototype.clickMove = function(button) {
		button.setTexture(this.buttonTextures[this.turn]);
		button.theValue    = this.turn;
		button.interactive = false;
		button.buttonMode  = false;

		if (this.gameIsOver()) {
			this.endGame()
		} else {
			this.turn = toggleTurn(this.turn);
			if (this.aiTurn()) {
				setTimeout(function() {
					var moveIdx = Logic.nextMoveIndex(this.turn, this.gameState());
					this.clickMove(this.buttons[moveIdx])
				}.bind(this), 1000)
			}
		}
	}
	Game.prototype.gameIsOver = function() {
		var state = this.gameState();

		return (
			Logic.xWins(state) ||
			Logic.oWins(state) ||
			Logic.tie(state)
		);
	}

	Game.prototype.endGame = function() {
		this.turn = null;

		// A winner you

		// Play again?
	}

	Game.prototype.gameState = function() {
    return R.pluck('theValue', this.buttons);
  }


	Game.prototype.aiTurn = function() {
		return (
			(this.turn == "X" && this.aiX) ||
			(this.turn == "O" && this.aiO)
		);
	}

	Game.prototype.aiMove = function() {
		var moveIdx = Logic.nextMoveIndex(this.turn, this.gameState());
		this.clickMove(this.buttons[moveIdx]);
	}

	function toggleTurn(turn) {
		return turn == "X" ? "O" : "X";
	}

	function generateRenderer() {
		var w = $(window).width();
		var wUsed = 0;
		var mLeft = 0;
		var h = $(window).height();
		var hUsed = 0;
		var mTop = 0;
		if (w < h) {
			// Set margin top
			mTop = (h-w)/2;
			h = w;
		}
		else {
			// Set margin left
			mLeft = (w-h)/2;
			w = h;
		}
		var renderer = PIXI.autoDetectRenderer(w, h);
		var elem = renderer.view;
		elem.style.marginTop = mTop + "px";
		elem.style.marginLeft = mLeft + "px";
		document.body.appendChild(elem);
		self.w = w;
		self.h = h;
		return renderer;
	}

	return Game;
	
})();

function TicTacToeWrapper() {
	var self = this;

	this.gameID = ko.observable(window.gameID);
	this.playerID = ko.observable(window.playerID);
	this.ws = null;
	this.wsConnectionStatus = ko.observable(false);

	function openWSConnection() {
		var host = "ws://" + location.hostname + ":3001/ws/" + self.gameID() + "/game?" + 
					Common.PARAM_NAME_CONNECTION_TYPES + "=" + Common.CONNECTION_TYPES.PLAYER + "&" +
					Common.PARAM_NAME_PLAYER_ID + "=" + self.playerID();

		self.ws = new WebSocket(host);
		self.ws.onopen = function(e) {
			console.log("Game WS connection opened.");
			self.wsConnectionStatus(true);
			pingHandler.start(self.ws);
		};
		self.ws.onclose = function(e) {
			console.log("Game WS connection closed.");
			self.wsConnectionStatus(false);
			pingHandler.stop();
		};
		self.ws.onmessage = function(e) {
			var m = JSON.parse(e.data);
			if (m.messageType === Common.MESSAGE_TYPES.PONG) {
				pingHandler.onPong();
			}
			else {
				console.log("Message received: " + e.data); //Should contain game state
				TicTacToeGame.onWSMessage(m);
			}
		};


	}

	this.sendWSMessage = function(m) {
		console.log("Sending ws message: " + m);
		self.ws.send(m);
	}


	function onPageLoad() {
		openWSConnection();
	}
	onPageLoad();

}

TicTacToeGame.run();

var ticTacToeWrapper = new TicTacToeWrapper();
ko.applyBindings(ticTacToeWrapper);