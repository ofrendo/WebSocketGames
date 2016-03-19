var CommonFrontend = (function() {

	function PingHandler() {
		var self = this;	
		var delay = 2000;
		var elem = document.getElementById("spanPing");

		this.timer = null;

		var pingTS = -1;
		var pongTS = -1;

		this.start = function(ws) {
			self.timer = setInterval(function() {
				pingTS = Date.now();
				ws.send(JSON.stringify({
					messageType: Common.MESSAGE_TYPES.PING
				}));
			}, delay)
		};

		this.onPong = function(m) {
			pongTS = Date.now();
			elem.innerText = pongTS - pingTS; 
		}

		this.stop = function() {
			clearInterval(self.timer);
		};

	}

	module = {};
	module.PingHandler = PingHandler;

	return module;
})();

function forEach(a, callback) {
	for (var i=0;i<a.length;i++) {
		callback(a[i], i);
	}
}