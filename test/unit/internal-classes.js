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

	function f0xyRequireTest(className){
		return asyncTest(className, function() {

			f0xy.require(className, function(){
				ok(f0xy.get(className), className + " is defined");
				start();
			});

			invokeTimeout();
		})
	}

	module("f0xy internal classes");

	f0xyRequireTest("f0xy.__BaseClass__");
	f0xyRequireTest("f0xy.Class");
	f0xyRequireTest("f0xy.Singleton");
	f0xyRequireTest("f0xy.Static");
	f0xyRequireTest("f0xy.NotificationManager");
	f0xyRequireTest("f0xy.Notification");

})();