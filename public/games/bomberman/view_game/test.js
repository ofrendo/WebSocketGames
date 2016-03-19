var CONST = {
	PLAYER_ORIENTATION: {
		FRONT: 0, 
		SIDE_LEFT: 1, //Looking left
		SIDE_RIGHT: 2, //Looking right
		BACK: 3,
	},
	PLAYER_ORIENTATION_PATH: {
		// Texture paths
		FRONT: "Bomberman/Front/Bman_F_f0",
		SIDE_LEFT: "Bomberman/Side/Bman_F_f0",
		SIDE_RIGHT: "Bomberman/Side/Bman_F_f0",
		BACK: "Bomberman/Back/Bman_B_f0"
	}
}

function InputHandler() {

	var self = this;

	this.keyW = false;
	this.keyA = false;
	this.keyS = false;
	this.keyD = false;

	this.start = function() {
		window.addEventListener("keydown", onKeyDown, false);
		window.addEventListener("keyup", onKeyUp, false);
		console.log("InputHandler: Listening to key strokes...");
	};

	this.stop = function() {
		window.removeEventListener("keydown", onKeyDown);
		window.removeEventListener("keyup", onKeyUp);
		console.log("InputHandler: Stopped listening to key strokes.");
	};

	function onKeyDown(event) {
		var keyCode = event.keyCode;
		switch (keyCode) {
			case 87: //w
				self.keyW = true;
				break;
			case 65: //a
				self.keyA = true;
				break;
			case 83: //s
				self.keyS = true;
				break;
			case 68: //d
				self.keyD = true;
				break;
		}

	}

	function onKeyUp(event) {
		var keyCode = event.keyCode;

		switch (keyCode) {
			case 87: //w
				self.keyW = false;
				break;
			case 65: //a
				self.keyA = false;
				break;
			case 83: //s
				self.keyS = false;
				break;
			case 68: //d
				self.keyD = false;
				break;
		}
	}
}

// This class simulates messages coming in from the server (so simulates a server) and will send them to the network handler
// we can simulate bad conditions in inputsender and see how networkhandler handles them!
// First we naively send snapshot of game data
// ideas for compression:
// if position/states dont change send isChanged -1
// use gameStateServer
function InputSender(inputHandler, networkHandler, mode) {

	var self = this;

	var p = gameStateServer.getPlayers()[0];

	if (mode === 0 || mode === undefined) {
		// Regular smooth sender, no delay
		var fps = 60;
		var m = 60 / fps; //multiplier
		// Only setmoving to false if all other keys are also false
		setInterval(function() {
			if (inputHandler.keyW) {
				p.setMoving(true);
				p.setOrientation(CONST.PLAYER_ORIENTATION.BACK);
				p.move(0, m*-1);
			}
			if (inputHandler.keyA) {
				p.setMoving(true);
				p.setOrientation(CONST.PLAYER_ORIENTATION.SIDE_LEFT);
				p.move(m*-1, 0);
			}
			if (inputHandler.keyS) {
				p.setMoving(true);
				p.setOrientation(CONST.PLAYER_ORIENTATION.FRONT);
				p.move(0, m*1);
			}
			if (inputHandler.keyD) {
				p.setMoving(true);
				p.setOrientation(CONST.PLAYER_ORIENTATION.SIDE_RIGHT);
				p.move(m*1, 0);
			}
			if (!inputHandler.keyW && !inputHandler.keyA && !inputHandler.keyS && !inputHandler.keyD) {
				// Stop moving
				p.setMoving(false);
			}

			sendFrame(gameStateServer);
		}, 1/fps * 1000);

	}

	function sendFrame(gameState) {
		var networkFrame = buildNetworkFrame(gameState);

		// Send this to networkhandler
		networkHandler.receiveFrame(networkFrame);
	}

}

// this what we actually send over the web
// sequence number?
// x, y, orientation, moving per player: what can be x/y though? different resolutions on different machines
// 
// 
function buildNetworkFrame(gameState) {
	var result = [];
	forEach(gameState.getPlayers(), function(p) {
		result.push(p.x);
		result.push(p.y);
		result.push(p.orientation);
		result.push(p.moving);
	});
	// do stuff like rounding numbers
	return result;
}

// This reconstructs a nice state change json object from the array we built above
/*function deconstructNetworkFrame(networkFrame, gameState) {
	var networkFrame = {};
	networkFrame.players = [];
	var counter = 0;
	for (counter=0;counter<gameState.getPlayers().length;counter=counter+4) {
		networkFrame.players.push({
			x: networkFrame[counter],
			y: networkFrame[counter+1],
			orientation: networkFrame[counter+2],
			moving: networkFrame[counter+3]
		});
	}
	return networkFrame;
}*/

// This class implements something to make the game go smoothly if events do not come in every 1/60th of a second
// Need a playout delay buffer to handle if things come in irregularily
// Should really make two canvases to compare the differences of different strategies later on
function NetworkHandler(playerGameState) {

	// ms. playout delay of 0 should lead to instant playout
	// even 1 is better so we have constant playout
	var playoutDelay = 0; 
	var buffer = [];

	function receiveFrame(networkFrame) {
		//var newNetworkFrame = deconstructNetworkFrame(networkFrame);
		if (playoutDelay === 0) {
			// Process new network frame immediately
			playoutFrame(networkFrame);
		}
	}

	function playoutFrame(networkFrame) {
		forEach(playerGameState.getPlayers(), function(p, i) {
			p.setPosition(networkFrame[i*4 +0], networkFrame[i*4 +1]);
			p.setOrientation(networkFrame[i*4 +2]);
			p.setMoving(networkFrame[i*4 +3]);
		});
	}

	this.receiveFrame = receiveFrame;
}

// This is the PRIMARY model
function GameState() {
	
	var self = this;
	var players = [];

	this.addPlayer = function(player) {
		players.push(player);
	};
	this.getPlayers = function() {
		return players;
	};

}

// This is the model: should NOT know anything about view
function Player() {
	var self = this;

	// States
	this.orientation = CONST.PLAYER_ORIENTATION.FRONT;
	this.orientationChanged = true; // Set to true initially so texture is drawn
	this.orientationOld = null; // Use to remove texture of old orientation
	this.moving = false; // This is only used for animation, NOT for calculating position
	this.movingChanged = false;

	this.x = 100;
	this.y = 100;

	// External functions
	this.setPosition = function(x, y) {
		this.x = x;
		this.y = y;
	};
	this.move = function(dX, dY) {
		this.x += dX;
		this.y += dY;
	}
	this.getPositionX = function() {
		return this.x; //self.textures[self.orientation].x;
	};
	this.getPositionY = function() {
		return this.y; //self.textures[self.orientation].y;
	}
	this.setMoving = function(moving) {
		if (self.moving !== moving) {
			self.moving = moving;
			self.movingChanged = true;
		}
	};
	this.setOrientation = function(orientation) {
		if (self.orientation !== orientation) {
			this.orientationOld = self.orientation; // Set old so old texture can be removed
			self.orientation = orientation;
			self.orientationChanged = true;
		}
	};


}

function BombermanTest() {
	var self = this;
	var spritePath = "/games/bomberman/res/Bombing_Chap_Sprite_Set/gen/bombermanAll.json";
	this.loader = PIXI.loader.add("bomberman", spritePath);
	this.stage = new PIXI.Container();
	this.stage.interactive = true;
	this.renderer = generateRenderer();

	// Only access to game state model
	this.gameState = null;

	// Each player has his own 4 textures assigned to it
	this.playerTextures = []; 

	this.onInitCallback = null;
	
	this.init = function(initGameState, onInitCallback) { // Pass in something like players starting in xy corners
		log("Init...");
		self.onInitCallback = onInitCallback;
		self.loader.load(onAssetsLoaded);

		self.gameState = initGameState;
	}

	function onAssetsLoaded() {
		console.log("Loaded assets.");
		
		forEach(self.gameState.getPlayers(), function(p, i) {
			self.playerTextures[i] = initializePlayerTextures();
		});

		if (self.onInitCallback !== null) {
			self.onInitCallback(true);
		}

		run();
	}

	function run() {
		log("Running...");

		animate();
	};

	function processFrame() {
		// Need to process all things that have changed, so delta to before
		// This does NOT mean position, which should be handled internally
		forEach(self.gameState.getPlayers(), function(p, i) {

			// Update positions of all player textures
			// TODO: interpolate
			forEach(self.playerTextures[i], function(a, j) {
				self.playerTextures[i][j].x = p.x;
				self.playerTextures[i][j].y = p.y;
			});

			// State: orientation changed
			if (p.orientationChanged === true) {
				p.orientationChanged = false;
				var tOld = self.playerTextures[i][p.orientationOld];
				var tNew = self.playerTextures[i][p.orientation];

				// Remove old orientation child
				self.stage.removeChild(tOld);

				// Add new orientation as child
				self.stage.addChild(tNew);
			}
			// State: moving changed
			if (p.movingChanged === true) {
				p.movingChanged = false;
				var t = self.playerTextures[i][p.orientation];

				// If moving play AND go to frame 0
				if (p.moving === true) {
					t.gotoAndPlay(0);
				}

				// Else stop AND go to frame 0
				if (p.moving === false) {
					t.gotoAndStop(0);
				}
			}
		});
	}
	function forEach(a, callback) {
		for (var i=0;i<a.length;i++) {
			callback(a[i], i);
		}
	}

	function initializePlayerTextures() {
		var result = [];
		for (var orientation in CONST.PLAYER_ORIENTATION) { // will be FRONT, BACK, ...
			var flipTexture = (orientation === "SIDE_LEFT");
			var frames = [];
			for (var i=0;i<=7;i++) {
				var path = CONST.PLAYER_ORIENTATION_PATH[orientation] + i + ".png";
				var f = PIXI.Texture.fromFrame(path);
				frames.push(f);
			}

			var t = new PIXI.extras.MovieClip(frames);
			t.position.set(100); 
			t.anchor.set(0.5, 0.5);
			t.animationSpeed = 0.25;
			if (flipTexture === true) {
				t.scale.x = -1;		
			}	
			result.push(t);
		}
		return result;
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

	function getImageTexture(path) {
		var img = new Image();
		img.src = 'path';
		var base = new PIXI.BaseTexture(img);
		var texture = new PIXI.Texture(base);// return you the texture
		return texture;
	}

	function animate() {
		self.renderer.render(self.stage);
		processFrame();
		fpsMeter.tick();
		requestAnimationFrame(animate.bind(self));
	}	

	function log(m) {
		console.log("BombermanTest: " + m);
	}
}

// Create separate models to simulate networking
// These MUST be the same at the start
// Server side model
var gameStateServer = new GameState();
var p1Server = new Player();
gameStateServer.addPlayer(p1Server);

// Client side model
var gameStateView1 = new GameState();
var p1View1 = new Player();
gameStateView1.addPlayer(p1View1);




var bombermanTest1 = new BombermanTest();
bombermanTest1.init(gameStateView1, function(status) {
	var networkHandler = new NetworkHandler(gameStateView1);

	// Simulate sender
	var inputHandler = new InputHandler();	
	var inputSender = new InputSender(inputHandler, networkHandler);
	inputHandler.start();
});


