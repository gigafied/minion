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

	module("f0xy configure...");

	// Do the first configure test
	f0xy.configure(
		{
			rootPath: "unit/classes",
			noPollution: true
		}
	);

	// Test whether rootPath is working
	asyncTest('rootPath', function() {

		f0xy.require("com.f0xy.test.ConfigureTest", function(){

			// Class should be defined
			ok(f0xy.get("com.f0xy.test.ConfigureTest"), "rootPath is being used.");
			start();
		});

		invokeTimeout();
	});

	// Test whether noPollution is working
	asyncTest('noPollution', function() {
		
		expect(4);

		f0xy.require("com.f0xy.test.ConfigureTest", function(){
			
			// Class should not exist globally
			ok(!window.com, "Test Class not reachable under the global namespace.");

			// Class should be gettable with f0xy.get
			ok(f0xy.get("com.f0xy.test.ConfigureTest"), "Test Class reachable with f0xy.get('com.f0xy.test.ConfigureTest') with noPollution = true");

			// Do the first configure test
			f0xy.configure(
				{
					noPollution: false
				}
			);

			// Class should now exist globally
			ok(com.f0xy.test.ConfigureTest, "Test Class now exists globally, after noPollution = false was set.");

			// Do the first configure test
			f0xy.configure(
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