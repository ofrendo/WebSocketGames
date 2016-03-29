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

	function NetworkTrafficHandler() {
		var self = this;

		var elemUp = document.getElementById("spanNetworkTrafficUp");
		var elemDown = document.getElementById("spanNetworkTrafficDown");
		var currentSecondTrafficUp = 0;
		var currentSecondTrafficDown = 0;
		// Start network size count
		setInterval(function() {
			elemUp.innerText = formatTraffic(currentSecondTrafficUp);
			elemDown.innerText = formatTraffic(currentSecondTrafficDown);
			currentSecondTrafficUp = 0;
			currentSecondTrafficDown = 0;
		}, 1000);

		this.addCurrentTrafficUp = function(amount) {
			currentSecondTrafficUp += amount;	
		}
		this.addCurrentTrafficDown = function(amount) {
			currentSecondTrafficDown += amount;
		}

		// in bps
		function formatTraffic(traffic) {
			var unit = "kbps";
			traffic /= 1024; // kbps
			if (traffic > 1024) {
				traffic /= 1024; // mbps
				unit = "mbps";
			}
			if (traffic > 1024) {
				traffic /= 1024; // gbps
				unit = "gbps";
			}
			traffic = traffic.toFixed(3);
			return traffic + " " + unit;
		}
	}

	function ConnectionWrapper() {
		var self = this;

		this.wsListener = null;
		this.gameID = ko.observable(window.gameID);
		this.playerID = ko.observable(window.playerID);
		this.ws = null;
		this.wsConnectionStatus = ko.observable(false);

		function openWSConnection() {
			var host = "ws://" + location.hostname + ":3001/ws/" + self.gameID() + "/game?";
			if (self.playerID() === "") {
				host += Common.PARAM_NAME_CONNECTION_TYPES + "=" + Common.CONNECTION_TYPES.VIEWER;
			}
			else {
				host += Common.PARAM_NAME_CONNECTION_TYPES + "=" + Common.CONNECTION_TYPES.PLAYER + "&" +
						Common.PARAM_NAME_PLAYER_ID + "=" + self.playerID();
			}

			self.ws = new WebSocket(host);
			self.ws.onopen = function(e) {
				console.log("Game WS connection opened.");
				self.wsConnectionStatus(true);
				pingHandler.start(self.ws);
			};
			self.ws.onclose = function(e) {
				console.log("Game WS connection closed: ");
				console.log(e);
				self.wsConnectionStatus(false);
				pingHandler.stop();
				if (typeof self.wsListener.stopSending === "function") {
					self.wsListener.stopSending();
				}
			};
			self.ws.onmessage = function(e) {
				networkTrafficHandler.addCurrentTrafficUp(e.data * 16);
				var m = JSON.parse(e.data);
				if (m.messageType === Common.MESSAGE_TYPES.PONG) {
					pingHandler.onPong();
				}
				else {
					//console.log("Message received: " + e.data); //Should contain game state
					if (typeof self.wsListener.onWSMessage === "function") self.wsListener.onWSMessage(m);
				}
			};
		}

		this.setWSListener = function(wsListener) {
			self.wsListener = wsListener;
		}

		this.sendWSMessage = function(m) {
			//console.log("Sending ws message: " + m);
			if (self.ws.readyState === 1) {
				networkTrafficHandler.addCurrentTrafficUp(m.length * 16);
				self.ws.send(m);
			}
		}


		function onPageLoad() {
			openWSConnection();
		}
		onPageLoad();

	}

	// Use this for getting renderer arguments for pixijs, meaning where is the canvas placed
	function getRendererArgs(iView, nViews) {
		var w = $(window).width();
		var h = $(window).height();

		if (nViews === 1) {
			var mLeft = 0;
			var mTop = 0;
			if (w < h) {
				// Set margin top
				mTop = (h-w)/2;
				h = w;
			}
			else {
				// Set margin left
				mLeft = (w-h)/2;
				w = h;
			}
			var scaleX = w / (gameConfig.game.xTiles * gameConfig.game.tileSize); // If server game width = 1000 but client only has 500, scaleX = 0.5
			var scaleY = h / (gameConfig.game.yTiles * gameConfig.game.tileSize);

			return {w: w, h: h, mLeft: mLeft, mTop: mTop, viewI: iView, scaleX: scaleX, scaleY: scaleY}; 
		}
		else if (nViews === 2) {
			var p = 5; // Padding of each renderer to middle

			// Assuming w > h, so two screens next to each other
			var wR = h; //rendererWidth
			var hR = h;

			var mLeft = 0;
			var mTop = 0;

			if (iView === 1) {
				mLeft = w/2 - p - wR;
			}
			else {
				mLeft = Math.round(w/2 + p);
			}
			var scaleX = wR / (gameConfig.game.xTiles * gameConfig.game.tileSize); // If server game width = 1000 but client only has 500, scaleX = 0.5
			var scaleY = hR / (gameConfig.game.yTiles * gameConfig.game.tileSize);

			return {w: wR, h: hR, mLeft: mLeft, mTop: mTop, viewI: iView, scaleX: scaleX, scaleY: scaleY};
		}
		else {
			return;
		}
	}
	function getFullscreenRendererArgs() {
		var w = $(window).width();
		var h = $(window).height();

		return {w: w, h: h, mLeft: 0, mTop: 0}; 
	}

	module = {};
	module.PingHandler = PingHandler;
	module.NetworkTrafficHandler = NetworkTrafficHandler;
	module.ConnectionWrapper = ConnectionWrapper;
	module.getRendererArgs = getRendererArgs;
	module.getFullscreenRendererArgs = getFullscreenRendererArgs;

	return module;
})();

function forEach(a, callback) {
	for (var i=0;i<a.length;i++) {
		callback(a[i], i);
	}
}