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
	var gameID = GameManager.createGame(gameName);
	if (gameID === null) {
		// Send 404 if no game with gameName could be found
		res.status(404).send();
	}
	else {
		res.status(200).send(gameID);
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
	if (GameManager.isValidGameID(gameID)) {
		if (GameManager.isValidPlayerID(gameID, playerID)) {
			res.render("join/join", {gameID: gameID, playerID: playerID});
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
})

// /join for input field for redirection to call below
// /join/:gameID to join lobby 
// if does exist redirect
// if doesnt exist 404 and redirect to join

// /view/:gameID to view a game


// /play/:gameID to play game, perhaps with :playerID param


module.exports = router;
