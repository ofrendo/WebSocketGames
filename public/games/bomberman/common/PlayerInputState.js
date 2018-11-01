"use strict";

(function(exports){

	// Maybe should assign playerID
	class PlayerInputState {
		constructor(playerID) {
			this.playerID = playerID;

			this.keyUp = false;
			this.keyLeft = false;
			this.keyDown = false;
			this.keyRight = false;
			this.keyBomb = false;
		}

		setKeyUp(value) {
			this.keyUp = value;
		}
		getKeyUp() {
			return this.keyUp;
		}
		setKeyLeft(value) {
			this.keyLeft = value;
		}
		getKeyLeft() {
			return this.keyLeft;
		}
		setKeyDown(value) {
			this.keyDown = value;
		}
		getKeyDown() {
			return this.keyDown;
		}
		setKeyRight(value) {
			this.keyRight = value;
		}
		getKeyRight() {
			return this.keyRight;
		}
		setKeyBomb(value) {
			this.keyBomb = value;
		}
		getKeyBomb() {
			return this.keyBomb;
		}
		setMovementKeysFalse() {
			this.keyUp = false;
			this.keyLeft = false;
			this.keyRight = false;
			this.keyDown = false;
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
		static setFromNetworkFrame(playerInputState, networkFrame) {
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