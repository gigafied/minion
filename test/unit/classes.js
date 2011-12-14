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

	module("f0xy.Class");
		asyncTest('com.f0xy.test.Test2', function() {

			expect(5);

			f0xy.require("com.f0xy.test.Test2", function(){

				// Class should be defined
				ok(f0xy.get("com.f0xy.test.Test2"), "com.f0xy.test.Test2 is defined.");

				var Test = f0xy.get("com.f0xy.test.Test2");
				var testInstance = new Test();
				var testInstance2 = new Test();

				ok(testInstance, "com.f0xy.test.Test2 was instantiated.")

				ok(testInstance.someTestMethod(), "instance.someTestMethod exists and returns true.");

				same(testInstance.testPropObj, testInstance2.testPropObj, "instance1.testPropObj === instance2.testPropObj.");

				testInstance.testPropObj = {prop1: "woot", prop2 : "woot2"};

				notEqual(testInstance.testPropObj, testInstance2.testPropObj, "instance1.testPropObj != instance2.testPropObj after changing instance1.testPropObj.");


				start();
			});

			invokeTimeout();
		});

	module("f0xy.Singleton");
		asyncTest('com.f0xy.test.SingletonTest', function() {

			expect(5);

			f0xy.require("com.f0xy.test.SingletonTest", function(){

				// Class should be defined
				ok(f0xy.get("com.f0xy.test.SingletonTest"), "com.f0xy.test.SingletonTest is defined.");

				var Test = f0xy.get("com.f0xy.test.SingletonTest");
				var testInstance = new Test();
				var testInstance2 = new Test();
				var testInstance3 = Test.getInstance();

				testInstance.testPropStr = "i changed";
				testInstance2.testPropBool = false;
				testInstance3.testPropObj = {yay: "This should exist on all instances..."};

				ok(testInstance, "com.f0xy.test.SingletonTest was instantiated.")

				same(testInstance, testInstance2, "instance1 === instance2");
				same(testInstance, testInstance3, "instance1 === instance3");
				ok(testInstance.someTestMethod(), "instance.someTestMethod exists and returns true.");

				start();

			});

			invokeTimeout(5);
		});

	module("f0xy.Static");
		asyncTest('com.f0xy.test.StaticTest', function() {

			expect(3);

			f0xy.require("com.f0xy.test.StaticTest", function(){

				// Class should be defined
				ok(f0xy.get("com.f0xy.test.StaticTest"), "com.f0xy.test.StaticTest is defined.");

				var Test = f0xy.get("com.f0xy.test.StaticTest");

				ok(Test.someTestMethod(), "StaticTest.someTestMethod() exists statically and returns true.");
				ok(Test.testPropBool, "StaticTest.testPropBool exists statically and === true");

				start();

			});

			invokeTimeout(3);
		});

})();