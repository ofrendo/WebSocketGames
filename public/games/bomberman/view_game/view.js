var CONST = GameState.CONST;

// Model representing the game
var gameStateView = new GameState(gameConfig);

// Controller listening to WS messages and changing according to a playout delay buffer

var useInterpolation = true;
if (Common.getParameterByName("useInterpolation") === "false") {
	useInterpolation = false;
}
var playoutDelay = parseInt(Common.getParameterByName("playoutDelay")) || 50;

var networkHandler = new NetworkHandler(gameStateView, {
	useInterpolation: useInterpolation,
	playoutDelay: playoutDelay
});

// Open WS connection
var bombermanWrapper = new CommonFrontend.ConnectionWrapper();
bombermanWrapper.setWSListener(networkHandler);

// On first network frame with information about game, initialize the view
networkHandler.setOnGameStateInit(function() {
	var bombermanView = new BombermanView(CommonFrontend.getRendererArgs(1, 1));
	bombermanView.init(
		gameStateView, 
		networkHandler.onBrowserAnimationFrame
	)
});



