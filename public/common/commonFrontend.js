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

		var elemSend = document.getElementById("spanNetworkTraffic");
		var currentSecondTrafficSend = 0;
		// Start network size count
		setInterval(function() {
			elemSend.innerText = formatTraffic(currentSecondTrafficSend);
			currentSecondTrafficSend = 0;
		}, 1000);


		this.addCurrentTrafficSend = function(amount) {
			currentSecondTrafficSend += amount;	
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

	module = {};
	module.PingHandler = PingHandler;
	module.NetworkTrafficHandler = NetworkTrafficHandler;

	return module;
})();

function forEach(a, callback) {
	for (var i=0;i<a.length;i++) {
		callback(a[i], i);
	}
}