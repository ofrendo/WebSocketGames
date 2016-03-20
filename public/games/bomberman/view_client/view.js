"use strict";
class InputHandler {
	constructor(playerInputState) {
		this.playerInputState = playerInputState;
	}
	startListening() {
		window.addEventListener("keydown", this.onKeyDown, false);
		window.addEventListener("keyup", this.onKeyUp, false);
		console.log("InputHandler: Listening to key strokes...");
	}
	stopListening() {
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		console.log("InputHandler: Stopped listening to key strokes.");
	};

	onKeyDown(event) {
		var keyCode = event.keyCode;
		switch (keyCode) {
			case 87: //w
				this.playerInputState.keyW = true;
				break;
			case 65: //a
				this.playerInputState.keyA = true;
				break;
			case 83: //s
				this.playerInputState.keyS = true;
				break;
			case 68: //d
				this.playerInputState.keyD = true;
				break;
		}

	}
	onKeyUp(event) {
		var keyCode = event.keyCode;
		switch (keyCode) {
			case 87: //w
				this.playerInputState.keyW = false;
				break;
			case 65: //a
				this.playerInputState.keyA = false;
				break;
			case 83: //s
				this.playerInputState.keyS = false;
				break;
			case 68: //d
				this.playerInputState.keyD = false;
				break;
		}
	}
}

class InputSender {

	constructor(playerInputState, wrapper) {
		this.playerInputState = playerInputState;
		this.wrapper = wrapper;

		this.frameNumber = 0;
		this.sendFPS = gameConfig.player.fps;
		this.frameDelay = 60 / this.sendFPS; // Will be 15/60 ==> send every 4 frames

		this.running = false;
	}

	incrementFrameNumber() {
		this.frameNumber = (this.frameNumber + 1) % this.frameDelay;
	}

	startSending() {
		this.log("Starting to send.");
		this.running = true;
		this.onAnimationFrame();
	}
	stopSending() {	
		// maybe send pause request
		this.running = false;
	}
	onAnimationFrame() {
		if (this.running === true) {
			this.incrementFrameNumber();
			if (this.frameNumber === 0) {
				this.sendFrame();
			}
		}
		requestAnimationFrame(this.onAnimationFrame.bind(this));
	}
	// Send frame of user inputs to server
	sendFrame() {
		var networkFrame = this.playerInputState.asNetworkFrame();
		this.wrapper.sendWSMessage(networkFrame);
	}
	

	log(m) {
		console.log("InputSender: " + m);
	}

}

// Model for input state
var playerInputState = new PlayerInputState();

// Track browser events to change playerInputState
var inputHandler = new InputHandler(playerInputState);

// Wrapper for websocket communication
var bombermanWrapper = new CommonFrontend.ConnectionWrapper();

// Send frames to server
var inputSender = new InputSender(playerInputState, bombermanWrapper);


inputHandler.startListening();
inputSender.startSending();
