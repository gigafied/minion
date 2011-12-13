(function(){

	var timeout = 2000;

	function invokeTimeout(){
		setTimeout(function(){start();}, timeout);
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

	module("f0xy classes...");

	f0xyRequireTest("f0xy.__BaseClass__");
	f0xyRequireTest("f0xy.Class");
	f0xyRequireTest("f0xy.Singleton");
	f0xyRequireTest("f0xy.Static");
	f0xyRequireTest("f0xy.NotificationManager");
	f0xyRequireTest("f0xy.Notification");

})();