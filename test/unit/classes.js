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

	module("minion.Class");
		asyncTest('minion.test.Test2', function() {

			expect(5);

			minion.require("minion.test.Test2", function(){

				// Class should be defined
				ok(minion.get("minion.test.Test2"), "minion.test.Test2 is defined.");

				var Test = minion.get("minion.test.Test2");
				var testInstance = new Test();
				var testInstance2 = new Test();

				ok(testInstance, "minion.test.Test2 was instantiated.")

				ok(testInstance.someTestMethod(), "instance.someTestMethod exists and returns true.");

				same(testInstance.testPropObj, testInstance2.testPropObj, "instance1.testPropObj === instance2.testPropObj.");

				testInstance.testPropObj = {prop1: "woot", prop2 : "woot2"};

				notEqual(testInstance.testPropObj, testInstance2.testPropObj, "instance1.testPropObj != instance2.testPropObj after changing instance1.testPropObj.");


				start();
			});

			invokeTimeout();
		});

	module("minion.Singleton");
		asyncTest('minion.test.SingletonTest', function() {

			expect(5);

			minion.require("minion.test.SingletonTest", function(){

				// Class should be defined
				ok(minion.get("minion.test.SingletonTest"), "minion.test.SingletonTest is defined.");

				var Test = minion.get("minion.test.SingletonTest");
				var testInstance = new Test();
				var testInstance2 = new Test();
				var testInstance3 = Test.getInstance();

				testInstance.testPropStr = "i changed";
				testInstance2.testPropBool = false;
				testInstance3.testPropObj = {yay: "This should exist on all instances..."};

				ok(testInstance, "minion.test.SingletonTest was instantiated.")

				same(testInstance, testInstance2, "instance1 === instance2");
				same(testInstance, testInstance3, "instance1 === instance3");
				ok(testInstance.someTestMethod(), "instance.someTestMethod exists and returns true.");

				start();

			});

			invokeTimeout(5);
		});

	module("minion.Static");
		asyncTest('minion.test.StaticTest', function() {

			expect(3);

			minion.require("minion.test.StaticTest", function(){

				// Class should be defined
				ok(minion.get("minion.test.StaticTest"), "minion.test.StaticTest is defined.");

				var Test = minion.get("minion.test.StaticTest");

				ok(Test.someTestMethod(), "StaticTest.someTestMethod() exists statically and returns true.");
				ok(Test.testPropBool, "StaticTest.testPropBool exists statically and === true");

				start();

			});

			invokeTimeout(3);
		});

})();