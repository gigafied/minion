(function(){

	var timeout = 2000;
	var timeoutID;

	function invokeTimeout(numStarts){
		numStarts = numStarts || 1;

		if(timeoutID){clearTimeout(timeoutID);}
		timeoutID = setTimeout(function(){
			for(var i = 0; i < numStarts; i ++){
				start();
			}
		}, timeout);
	}

	module("MinionJS Notifications");

	// Do the first configure test
	minion.configure(
		{
			classPath: "unit/classes"
		}
	);

	// Test whether rootPath is working
	asyncTest('publish/subscribe', function() {

		minion.require(["minion.test.TestPublisher", "minion.test.TestSubscriber"], function(TestPublisher, TestSubscriber) {

			console.log(TestPublisher, TestSubscriber);

			var publisher = new TestPublisher();
			var subscriber = new TestSubscriber();

			window.notificationReceived = false;

			publisher.testPublish();

			ok(window.notificationReceived, "Notification received!");

			publisher.destroy();
			subscriber.destroy();

			start();
		});

		invokeTimeout();
	});

	// Test whether rootPath is working
	asyncTest('unsubscribe()', function() {

		minion.require(["minion.test.TestPublisher", "minion.test.TestSubscriber"], function(TestPublisher, TestSubscriber) {

			var publisher = new TestPublisher();
			var subscriber = new TestSubscriber();

			subscriber.unsubscribe("testNotification");

			window.notificationReceived = false;

			publisher.testPublish();

			ok(!window.notificationReceived, "unsubscribe successful.");

			publisher.destroy();
			subscriber.destroy();

			start();
		});

		invokeTimeout();
	});	

	// Test whether rootPath is working
	asyncTest('unsubscribeAll()', function() {

		minion.require(["minion.test.TestPublisher", "minion.test.TestSubscriber"], function(TestPublisher, TestSubscriber) {

			var publisher = new TestPublisher();
			var subscriber = new TestSubscriber();

			subscriber.unsubscribeAll();

			window.notificationReceived = false;

			publisher.testPublish();

			ok(!window.notificationReceived, "unsubscribeAll successful.");

			publisher.destroy();
			subscriber.destroy();

			start();
		});

		invokeTimeout();
	});		

})();