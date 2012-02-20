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

	function invokeTimeout(numStarts){
		numStarts = numStarts || 1;

		if(timeoutID){clearTimeout(timeoutID);}
		timeoutID = setTimeout(function(){
			for(var i = 0; i < numStarts; i ++){
				start();
			}
		}, timeout);
	}

	function minionRequireTest(className){
		return asyncTest(className, function() {

			minion.require(className, function(){
				ok(minion.get(className), className + " is defined");
				start();
			});

			invokeTimeout();
		})
	}

	module("minion internal classes");

	minionRequireTest("minion.BaseClass");
	minionRequireTest("minion.Class");
	minionRequireTest("minion.Singleton");

})();