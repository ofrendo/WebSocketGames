var express = require('express');
var router = express.Router();

var GameManager = require("../js/GameManager");
var WSManager = require("../js/WSManager");

/* GET home page. */
router.get("/", function(req, res, next) {
	res.render('lib/views/index', { title: 'WebSocketGames' });
});

// GET html create page
router.get("/create", function(req, res, next) {
	res.render("create/create", { config: GameManager.config });
});
// API call POST create new game
router.post("/create/:gameName", function(req, res, next) {
	var gameName = req.params.gameName;
	var result = GameManager.createGame(gameName);
	if (result === null) {
		// Send 404 if no game with gameName could be found
		res.status(404).send();
	}
	else {
		res.status(200).send(result);
	}
});
// API call DELETE close game
router.delete("/create/:gameID", function(req, res, next) {
	var gameID = req.params.gameID;
	var result = GameManager.closeGame(gameID);
	if (result === undefined) {
		res.status(404).send();
	}
	else if (result === false) {
		res.status(401).send("Game already started.");
	}
	else {
		res.status(200).send();
	}
});

router.get("/join", function(req, res, next) {
	res.render("join/join");
});
router.head("/join/:gameID/:playerID", function(req, res, next) {
	var gameID = req.params.gameID;
	var playerID = req.params.playerID;
	if (GameManager.isValidGameID(gameID)) {
		if (GameManager.isValidPlayerID(gameID, playerID)) {
			res.status(200).send();
		}
		else {
			// Game exists but playerID already taken
			res.status(409).send();
		}
		
	}
	else {
		// Game does not exist
		res.status(404).send();
	}
});
router.get("/join/:gameID/:playerID", function(req, res, next) {
	var gameID = req.params.gameID;
	var playerID = req.params.playerID;
	console.log("Player " + playerID + " for " + gameID + " attemping to join...");
	if (GameManager.isValidGameID(gameID)) {
		if (GameManager.isValidPlayerID(gameID, playerID)) {
			var game = GameManager.getGameByID(gameID);
			res.render("join/join", {gameID: gameID, playerID: playerID, gameConfigString: JSON.stringify(game.getGameConfig())});
		}
		else {
			// Game exists but playerID already taken
			console.log("Player " + playerID + " for " + gameID + " is invalid.");
			res.status(409).send();
		}
		
	}
	else {
		// Game does not exist
		res.status(404).send();
	}
});

router.post("/start/:gameID", function(req, res, next) {
	var gameID = req.params.gameID;
	if (GameManager.isValidGameID(gameID)) {
		var game = GameManager.getGameByID(gameID);
		var result = game.start();
		if (result === true) {
			res.status(200).send();
		}
		else {
			res.status(403).send();
		}
	}
	else {
		// Game does not exist
		res.status(404).send();
	}
});

router.get("/view/:gameID", function(req, res, next) {
	
});

// /view/:gameID to view a game
// /play/:gameID to play game, perhaps with :playerID param


module.exports = router;
