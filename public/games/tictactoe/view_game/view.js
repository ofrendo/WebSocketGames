

function TicTacToeView() {

	var self = this;

	this.gameID = ko.observable(null);

	function openWSConnection(gameID) {

	}

	function onPageLoad() {
		self.gameID(window.gameID);
		console.log("============== Init page with gameID " + self.gameID() + " ==============");
		openWSConnection(gameID);
	}
	onPageLoad();

}



ko.applyBindings(new TicTacToeView());
