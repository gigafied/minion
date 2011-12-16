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
			classPath: "unit/classes",
			pollute: false
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

	// Test whether pollute is working
	asyncTest('pollute', function() {
		
		expect(4);

		minion.require("com.minion.test.ConfigureTest", function(){
			
			// Class should not exist globally
			ok(!window.com, "Test Class not reachable under the global namespace.");

			// Class should be gettable with minion.get
			ok(minion.get("com.minion.test.ConfigureTest"), "Test Class reachable with minion.get('com.minion.test.ConfigureTest') with pollute = false");

			// Do the first configure test
			minion.configure(
				{
					pollute: true
				}
			);

			// Class should now exist globally
			ok(com.minion.test.ConfigureTest, "Test Class now exists globally, after pollute = true was set.");

			// Do the first configure test
			minion.configure(
				{
					pollute: false
				}
			);

			// Class should not exist globally
			ok(!window.com, "Test Class no longer reachable globally after subsequent pollute = false");

			start();
		});

		invokeTimeout();
	});

})();