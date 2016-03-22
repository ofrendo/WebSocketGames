var CONST = GameState.CONST;

// Model representing the game
var gameStateView = new GameState();

// Controller listening to WS messages and changing according to a playout delay buffer
var networkHandler = new NetworkHandler(gameStateView, {
	useInterpolation: true,
	playoutDelay: 50
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



