"use strict";

var CONST = GameState.CONST;

function InputHandler() {

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
				playerInputState.setKeyUp(true);
				break;
			case 65: //a
				playerInputState.setKeyLeft(true);
				break;
			case 83: //s
				playerInputState.setKeyDown(true);
				break;
			case 68: //d
				playerInputState.setKeyRight(true);
				break;
		}

	}
	function onKeyUp(event) {
		var keyCode = event.keyCode;
		switch (keyCode) {
			case 87: //w
				playerInputState.setKeyUp(false);
				break;
			case 65: //a
				playerInputState.setKeyLeft(false);
				break;
			case 83: //s
				playerInputState.setKeyDown(false);
				break;
			case 68: //d
				playerInputState.setKeyRight(false);
				break;
		}
	}
}

// This class simulates messages coming in from the server (so simulates a server) and will send them to the network handler
// First we naively send snapshot of game data
// ideas for compression:
// if position/states dont change send isChanged -1
// use gameStateServer: this is the server
// Network listener can be a simulation, or the websocket handler
function InputSender(playerInputState, networkListener) {	

	var gameStateFrameProcessor = new GameStateFrameProcessor(window.gameConfig, gameStateServer, [playerInputState]);

	var self = this;
	var frameNumber = 0;

	//var p = gameStateServer.getPlayers()[0];

	// Regular smooth sender
	//var fps = 15; // this is how many frames are sent, not how many frames are rendered per second
	//var m = 4*60 / fps; //multiplier
	var interval = Math.round(1/window.gameConfig.server.fps * 1000);
	var currentTime = Date.now();

	setInterval(function() { // this is one server frame

		networkTrafficHandler.addCurrentTrafficUp(playerInputState.asNetworkFrame().length * 16);
		
		gameStateFrameProcessor.processSnapshot.call(gameStateFrameProcessor, Date.now() - currentTime);
		var networkFrame = gameStateFrameProcessor.getNetworkFrame();
		sendFrame(networkFrame);
		//console.log(networkFrame);
		currentTime = Date.now();

	}, interval);

	console.log("InputSender: Init with fps=" + window.gameConfig.server.fps);

	function sendFrame(networkFrame) {
		// Send this to network
		networkListener.sendFrame(networkFrame);
	}

}


// Simulates network sending: can simulate packet loss, latency here
// Networklistener is something that can receive frames
// @param args
// latency: time to wait before package will be sent in ms
// packageLoss: chance of packages being lost [0, 1]
function NetworkSimulation(networkListeners, args) {

	var self = this;

	this.sendFrame = function(networkFrame) {
		if (Math.random() < args.packageLoss) {
			// Oops, package lost. not sending
			return;
		}

		// No latency, no packet loss
		forEach(networkListeners, function(listener) {

			networkTrafficHandler.addCurrentTrafficDown(networkFrame.length * 16);	

			listener.receiveFrame(networkFrame);
		})
	}

}


// Create separate models to ulate networking
// These MUST be the same at the start
// Server side model
var gameStateServer = GameState.buildRandomGameState(gameConfig);

// Client side models
var gameStateView1 = new GameState(gameConfig);
//var p1View1 = new GameState.Player();
//gameStateView1.addPlayer(p1View1);

// CLient side models of right view
var gameStateView2 = new GameState(gameConfig);
//var p1View2 = new GameState.Player();
//gameStateView2.addPlayer(p1View2);


// Receives frames and changes the model: Sets the observer
var networkHandler1 = new NetworkHandler(gameStateView1, {
	playoutDelay: 0,
	useInterpolation: false
});
var networkHandler2 = new NetworkHandler(gameStateView2, {
	playoutDelay: 100,
	useInterpolation: true
}); // Use this for different options and tests

// Server side stuff simulation
var networkSimulation = new NetworkSimulation([networkHandler1, networkHandler2], {
	latency: 0,
	packageLoss: 0.05
});


var playerInputState = new PlayerInputState();
var inputSender = new InputSender(playerInputState, networkSimulation);


// Handles changing playerinputstate
var inputHandler = new InputHandler();	

var bombermanView1 = new BombermanView(CommonFrontend.getRendererArgs(1, 2));
bombermanView1.init(
	gameStateView1, 
	function onBrowserAnimationCallFrame() {
		fpsMeter.tick();
		networkHandler1.onBrowserAnimationFrame(arguments[0]);
	},
	function(status) {
		inputHandler.start();
	}
);


var bombermanView2 = new BombermanView(CommonFrontend.getRendererArgs(2, 2));
bombermanView2.init(
	gameStateView2, 
	networkHandler2.onBrowserAnimationFrame
);



// Made for two screens atm


