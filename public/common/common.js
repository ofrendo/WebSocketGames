(function(exports){

	exports.PARAM_NAME_CONNECTION_TYPES = "connectionType";
	exports.PARAM_NAME_PLAYER_ID = "playerID";

	exports.CONNECTION_TYPES = {
		PLAYER: "player",
		HOST: "host"
	};






	exports.isValidClientID = function(clientID) {
		return clientID.length >= 4 && clientID.length <= 20;
	};



})(typeof exports === 'undefined' ? 
	this['Common']={} : 
	exports);