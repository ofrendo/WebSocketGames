(function(exports){

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

	GameState.Player = Player;

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
			self.x = x;
			self.y = y;
		};
		this.move = function(dX, dY) {
			self.x += dX;
			self.y += dY;
		}
		this.getPositionX = function() {
			return self.x; //self.textures[self.orientation].x;
		};
		this.getPositionY = function() {
			return self.y; //self.textures[self.orientation].y;
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

	exports.GameState = GameState;

})(typeof exports === 'undefined' ? 
	//this['GameState']={} : 
	window :
	exports);