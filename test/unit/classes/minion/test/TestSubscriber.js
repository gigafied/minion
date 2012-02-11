minion.define("minion.test", {
	
	TestSubscriber : minion.extend("minion.Class", {
		
		init : function(){
			this.subscribe("testNotification", this._handleTestNotification);	
		},

		_handleTestNotification : function (n) {
			window.notificationReceived = true;

		},

		destroy : function () {
			this.unsubscribeAll();
		}

	})
});