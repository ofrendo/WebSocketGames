"use strict";
class InputHandler {
	constructor(playerInputState) {
		this.playerInputState = playerInputState;
	}
	startListening() {
		window.addEventListener("keydown", this.onKeyDown.bind(this), false);
		window.addEventListener("keyup", this.onKeyUp.bind(this), false);
		console.log("InputHandler: Listening to key strokes...");
	}
	stopListening() {
		window.removeEventListener("keydown", this.onKeyDown.bind(this));
		window.removeEventListener("keyup", this.onKeyUp.bind(this));
		console.log("InputHandler: Stopped listening to key strokes.");
	};

	onKeyDown(event) {
		var keyCode = event.keyCode;
		switch (keyCode) {
			case 87: //w
				this.playerInputState.setKeyUp(true);
				break;
			case 65: //a
				this.playerInputState.setKeyLeft(true);
				break;
			case 83: //s
				this.playerInputState.setKeyDown(true);
				break;
			case 68: //d
				this.playerInputState.setKeyRight(true);
				break;
			case 32: // space
				this.playerInputState.setKeyBomb(true);
				break;
		}

	}
	onKeyUp(event) {
		var keyCode = event.keyCode;
		switch (keyCode) {
			case 87: //w
				this.playerInputState.setKeyUp(false);
				break;
			case 65: //a
				this.playerInputState.setKeyLeft(false);
				break;
			case 83: //s
				this.playerInputState.setKeyDown(false);
				break;
			case 68: //d TODO add arrow keys
				this.playerInputState.setKeyRight(false);
				break;
			case 32: // space
				this.playerInputState.setKeyBomb(false);
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
		this.log("Prepared to send...");
		this.running = true;
		//this.onAnimationFrame();
	}
	stopSending() {	
		// maybe send pause request
		this.log("Stopping of input sending.");
		this.running = false;
	}
	onAnimationFrame() {
		if (this.running === true) {
			this.incrementFrameNumber();
			if (this.frameNumber === 0) {
				this.sendFrame();
			}
			//requestAnimationFrame(this.onAnimationFrame.bind(this));
		}
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

// PIXIjs canvas of the controller
var controllerView = new ControllerView(CommonFrontend.getFullscreenRendererArgs(), playerInputState);
// Track browser key events to change playerInputState
var inputHandler = new InputHandler(playerInputState);

// Wrapper for websocket communication
var bombermanWrapper = new CommonFrontend.ConnectionWrapper();

// Send frames to server
var inputSender = new InputSender(playerInputState, bombermanWrapper);
bombermanWrapper.setWSListener(inputSender);
controllerView.setOnAnimationFrame(inputSender.onAnimationFrame.bind(inputSender));

inputHandler.startListening();
inputSender.startSending();



//window.onload = onScreenChange;
window.addEventListener("orientationchange", onScreenChange);
window.addEventListener("resize", onScreenChange);

function onScreenChange() {
	// Scroll to fullscreen
	// meh...
	//window.scrollTo(0, 1);
	//hideAddressBar();

	controllerView.adaptRenderer(CommonFrontend.getFullscreenRendererArgs());
}

// Hide address bar on devices like the iPhone
//---------------------------------------------
function hideAddressBar() {
	// Big screen. Fixed chrome likely.
	//if(screen.width > 980 || screen.height > 980) return;

	// Standalone (full screen webapp) mode
	//if(window.navigator.standalone === true) return;

	// Page zoom or vertical scrollbars
	/*if(window.innerWidth !== document.documentElement.clientWidth) {
		// Sometimes one pixel too much. Compensate.
		if((window.innerWidth - 1) !== document.documentElement.clientWidth) return;

	}*/

	setTimeout(function() {
		// Already scrolled?
		if(window.pageYOffset !== 0) return;

		// Perform autoscroll
		window.scrollTo(0, 1);

		// Reset body height and scroll
		if(bodyTag !== undefined) bodyTag.style.height = window.innerHeight + 'px';
		window.scrollTo(0, 0);

	}, 1000);

}

function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  }
  else {
    cancelFullScreen.call(doc);
  }
}



