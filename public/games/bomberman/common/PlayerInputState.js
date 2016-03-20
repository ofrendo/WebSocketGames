"use strict";

(function(exports){

	// Maybe should assign playerID
	class PlayerInputState {
		constructor() {
			this.keyUp = false;
			this.keyLeft = false;
			this.keyDown = false;
			this.keyRight = false;
			this.keyBomb = false;
		}

		asNetworkFrame() {
			var result = 
				(this.keyUp ? "1" : "0") + "" +
				(this.keyLeft ? "1" : "0") + "" +
				(this.keyDown ? "1" : "0") + "" +
				(this.keyRight ? "1" : "0") + "" +
				(this.keyBomb ? "1" : "0"); 
			return result;
		}
		// Changes a given playerInputState to match a given networkFrame
		static fromNetworkFrame(playerInputState, networkFrame) {
			networkFrame = networkFrame.split("");
			playerInputState.keyUp = networkFrame[0] === "1";
			playerInputState.keyLeft = networkFrame[1] === "1";
			playerInputState.keyDown = networkFrame[2] === "1";
			playerInputState.keyRight = networkFrame[3] === "1";
			playerInputState.keyBomb = networkFrame[4] === "1";
		}
	}	

	exports.PlayerInputState = PlayerInputState;

})(typeof exports === 'undefined' ? 
	//this['GameState']={} : 
	window :
	exports);