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
	asyncTest('classPath', function() {

		minion.require("minion.test.ConfigureTest", function(){

			// Class should be defined
			ok(minion.get("minion.test.ConfigureTest"), "classPath is being used.");
			start();
		});

		invokeTimeout();
	});

})();