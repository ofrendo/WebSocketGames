// This class implements something to make the game go smoothly if events do not come in every 1/60th of a second
// Need a playout delay buffer to handle if things come in irregularily
// @param args: 
// useInterpolation use linear interpolation together with a playout buffer
// playoutDelay: how big of a delay before frames are played out? 
function NetworkHandler(playerGameState, args) {


	// ms. playout delay of 0 should lead to instant playout
	// this needs to be greater than so at least one package is always in buffer
	// Greater values of this can deal better with package loss, but only together with linear interpolation. otherwise just induced lag
	var self = this;
	var playoutBuffer = {};
	var frameNumber = 0;
	var lastFramePlayed = null;
	var isGameInitialized = playerGameState.getPlayers().length > 0;

	// one networkFrame represents one snapshot
	function receiveFrame(networkFrame) {
		//var newNetworkFrame = deconstructNetworkFrame(networkFrame);
		networkFrame = JSON.parse(networkFrame);
		
		if (isGameInitialized === false) {
			GameState.buildFromNetworkFrame(playerGameState, networkFrame);
			isGameInitialized = true;
			if (typeof self.onGameStateInit === "function") {
				self.onGameStateInit();
			}
			return;
			//console.log(networkFrame);
			//console.log("here: " + playerGameState.getPlayers().length + " " +  playerGameState.getEntities().length);
		}
		//console.log(networkFrame);
		frameNumber = networkFrame.pop();
		networkFrame.splice(0, 2);
		//console.log(networkFrame);
		if (args.playoutDelay === 0) {
			// Process new network frame immediately
			playoutFrame(networkFrame);
		}
		else {

			/*if (frameNumber === 1) {
				firstFrameTime = Date.now();
			}*/
			// Add input to it indexed by frame - which frame? assuming server frame
			playoutBuffer[frameNumber] = networkFrame;
			playoutBuffer[frameNumber].receivedTime = Date.now();
			playoutBuffer[frameNumber].frameNumber = frameNumber;
		}
	}

	// Called when browser does one frame
	// Playout all applicable frames here
	function onBrowserAnimationFrame() {
		var currentTime = Date.now();

		// Playout all frames where timeDiff > playoutDelay?
		//var playoutCount = 0;

		// Will cycle from oldest to newest?
		//console.log("cycle start: " + Object.keys(playoutBuffer));
		for (var frameNumber in playoutBuffer) {
			var timeDiff = currentTime - playoutBuffer[frameNumber].receivedTime;
			if (timeDiff > args.playoutDelay) {
				//playoutCount++;
				//if (playoutCount > 1) console.log("MORE THAN 1 FRAME AT THE SAME TIME");
				playoutFrame(playoutBuffer[frameNumber]);
				lastFramePlayed = playoutBuffer[frameNumber];
				delete playoutBuffer[frameNumber]; // lets hope no memory leaks lol
				return; //done
			}
			else {
				//interpolate here? from last frame played to oldest frame in buffer
				if (lastFramePlayed !== null && args.useInterpolation === true) {
					//console.log("Interpolating to frame " + frameNumber);
					var interpolatedNetworkFrame = interpolateFrames(lastFramePlayed, playoutBuffer[frameNumber]);
					playoutFrame(interpolatedNetworkFrame);
				}
				return; //done, dont interpolate another frame
			}
		}
	}

	function playoutFrame(networkFrame) {
		//console.log(networkFrame);
		forEach(playerGameState.getPlayers(), function(p, i) {
			p.setPosition(networkFrame[i*4 +0], networkFrame[i*4 +1]);
			p.setOrientation(networkFrame[i*4 +2]);
			p.setMoving(networkFrame[i*4 +3]);
		});

	}

	function interpolateFrames(f1, f2) {
		// Assuming f2 is after f1
		var currentTime = Date.now();
		var result = [];
		// how far along are we on vector from f1 to f2? [0,1]
		// ==> 
		var lambda = (currentTime - f1.receivedTime - args.playoutDelay) / (f2.receivedTime - f1.receivedTime);
		result.fFrom = f1.frameNumber;
		result.fTo = f2.frameNumber;
		result.lambda = lambda;
		forEach(playerGameState.getPlayers(), function(p, i) {
			var dx = Math.round((f2[i*4 +0] - f1[i*4 +0]) * lambda);
			var dy = Math.round((f2[i*4 +1] - f1[i*4 +1]) * lambda);

			result.push(f1[i*4 +0] + dx); // x
			result.push(f1[i*4 +1] + dy); // y
			result.push(p.orientation); // dont interpolate orientation
			result.push(p.moving); // dont interpolate moving
		});
		return result;
	}

	this.setOnGameStateInit = function(callback) {
		self.onGameStateInit = callback;
	};
	this.receiveFrame = receiveFrame;
	this.onWSMessage = receiveFrame;
	this.onBrowserAnimationFrame = onBrowserAnimationFrame;
}


function BombermanView(rendererArgs) {
	var self = this;
	var spritePath = "/games/bomberman/res/Bombing_Chap_Sprite_Set/gen/bombermanAll.json";
	this.loader = PIXI.loader.add("bomberman" + rendererArgs.viewI, spritePath);
	this.stage = new PIXI.Container();
	this.stage.interactive = true;
	this.renderer = generateRenderer(rendererArgs);

	// Only access to game state model
	this.gameState = null;
	this.isRunning = false;

	// Each player has his own 4 textures assigned to it
	this.playerTextures = []; 

	this.onBrowserAnimationFrame = null;
	this.onInitCallback = null;
	
	this.init = function(initGameState, onBrowserAnimationFrame, onInitCallback) { // Pass in something like players starting in xy corners
		log("Init...");
		self.onBrowserAnimationFrame = onBrowserAnimationFrame;
		self.onInitCallback = onInitCallback;
		self.loader.load(onAssetsLoaded);

		self.gameState = initGameState;
	}

	function onAssetsLoaded() {
		console.log("Loaded assets.");
		
		forEach(self.gameState.getPlayers(), function(p, i) {
			self.playerTextures[i] = initializePlayerTextures();
		});

		if (typeof self.onInitCallback === "function") {
			self.onInitCallback(true);
		}

		run();
	}

	function run() {
		log("Running...");
		self.isRunning = true;

		animate();
	};

	function processFrame() {
		// call onBrowserAnimationFrame for playout delay buffer
		if (self.onBrowserAnimationFrame !== null) {
			self.onBrowserAnimationFrame();
		}

		//console.log(self.gameState.getEntities().length);
		// Need to process all things that have changed, so delta to before
		// This does NOT mean position, which should be handled internally by pixijs
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
				//console.log(p);
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


	// w, h, mLeft, mTop
	function generateRenderer(rendererArgs) {
		log("Init: Rendering ");
		//console.log(rendererArgs);
		var renderer = new PIXI.WebGLRenderer(rendererArgs.w, rendererArgs.h);
		var elem = renderer.view;
		elem.style.marginTop = rendererArgs.mTop + "px";
		elem.style.marginLeft = rendererArgs.mLeft + "px";
		document.body.appendChild(elem);
		//console.log(elem);
		self.w = rendererArgs.w;
		self.h = rendererArgs.h;
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
		if (self.isRunning === true) {
			self.renderer.render(self.stage);
			processFrame();
		}
		
		requestAnimationFrame(animate.bind(self));
	}	

	function log(m) {
		console.log("BombermanView: " + m);
	}
}