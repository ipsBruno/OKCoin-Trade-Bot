"use strict";

var exports = module.exports = {};

exports.exchangeData 		= null;
exports.userData 			= null;
exports.updateOders 		= null;
exports.userOrders			= null;


exports.ConfigureInfos = function(callback = null, callbackorders = null) {


	exports.ConfigureExchangeInfo();
	exports.ConfigureUserInfo();

	var internal = setInterval(function() {
		if (exports.exchangeData != null && exports.userData != null) {

			if(callback != null) {
				callback();
			}
			
			clearInterval(internal);
		}
	}, 1000);
	

	if(exports.updateOders  != null) {
		clearInterval(exports.updateOders) ;
	}
	
	exports.updateOders  = setInterval(function() {			
		global.privateClient.getOrderInfo(function(c, d) {
				if (!c) {
					if (d["result"]) {
						exports.userOrders = d;
						
						if(callbackorders != null) {
							callbackorders (d) ;
						}
						
					}
				}
			}, 'btc_usd', '-1');
	}, 1000);
	
	return true;

};


exports.ConfigureExchangeInfo = function() {

	global.publicClient.getTicker(function(a, b) {
		if (a) {
			throw new Error(a);
		} else {
			exports.exchangeData = b;

		}
	}, 'btc_usd');
};

exports.ConfigureUserInfo = function() {
	global.privateClient.getUserInfo(function(a, b) {
		if (a) {
			throw new Error(a);
		} else {
			exports.userData = b;
		}
	});
};

exports.getBitcoinPrice = function() {
	return parseFloat(exports.exchangeData["ticker"]["last"]);
};

exports.getBitcoinUser = function() {
	return parseFloat(exports.userData["info"]["funds"]["free"]["btc"]);
};

exports.getDollarUser = function() {
	return parseFloat(exports.userData["info"]["funds"]["free"]["usd"]);
};


exports.sellbtc = function(amount, price, callback) {
	global.privateClient.addTrade(function(a, b) {
		if (a) {
			throw new Error(a);
		} else {
			if (b["result"]) {
				var interval = setInterval(function() {
					if (exports.userOrders["result"]) {
						var find = false;
						for (var v = 0; v != exports.userOrders["orders"].length; v++) {
							if (exports.userOrders["orders"][v]["order_id"] == b["order_id"]) {
								find = true;
								break;
							}
						}
						if (!find) {
							clearInterval(interval);
							
							if(callback != null) {
								callback(b["order_id"], 'sell');
							}
						}
					}				
				},	1000);
			}
		}
	}, 'btc_usd', 'sell', amount, price);
};

exports.buybtc = function(amount, price, callback = null) {
	global.privateClient.addTrade(function(a, b) {
		if (a) {
			throw new Error(a);
		} else {
			if (b["result"]) {
				var interval = setInterval(function() {
					if (exports.userOrders["result"]) {
						var find = false;
						for (var v = 0; v != exports.userOrders["orders"].length; v++) {
							if (exports.userOrders["orders"][v]["order_id"] == b["order_id"]) {
								find = true;
								break;
							}
						}
						if (!find) {
							clearInterval(interval);
							
							if(callback != null) {
								callback(b["order_id"], 'buy');
							}
						}
					}				
				},	1000);
			}
		}
	}, 'btc_usd', 'buy', amount, price);
};
