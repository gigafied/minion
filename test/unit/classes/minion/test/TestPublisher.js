minion.define("minion.test", {
	
	TestPublisher : minion.extend("minion.Class", {
		
		init : function(){
			
		},

		testPublish : function () {
			this.publish("testNotification", {someProp: "someValue"});
		},

		destroy : function () {
			
		}

	})
});	