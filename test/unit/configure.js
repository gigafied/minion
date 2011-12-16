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

	module("minion.configure()");

	// Do the first configure test
	minion.configure(
		{
			rootPath: "unit/classes",
			noPollution: true
		}
	);

	// Test whether rootPath is working
	asyncTest('rootPath', function() {

		minion.require("com.minion.test.ConfigureTest", function(){

			// Class should be defined
			ok(minion.get("com.minion.test.ConfigureTest"), "rootPath is being used.");
			start();
		});

		invokeTimeout();
	});

	// Test whether noPollution is working
	asyncTest('noPollution', function() {
		
		expect(4);

		minion.require("com.minion.test.ConfigureTest", function(){
			
			// Class should not exist globally
			ok(!window.com, "Test Class not reachable under the global namespace.");

			// Class should be gettable with minion.get
			ok(minion.get("com.minion.test.ConfigureTest"), "Test Class reachable with minion.get('com.minion.test.ConfigureTest') with noPollution = true");

			// Do the first configure test
			minion.configure(
				{
					noPollution: false
				}
			);

			// Class should now exist globally
			ok(com.minion.test.ConfigureTest, "Test Class now exists globally, after noPollution = false was set.");

			// Do the first configure test
			minion.configure(
				{
					noPollution: true
				}
			);

			// Class should not exist globally
			ok(!window.com, "Test Class no longer reachable globally after subsequent noPollution = true");

			start();
		});

		invokeTimeout();
	});

})();