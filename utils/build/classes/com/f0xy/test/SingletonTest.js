f0xy.define("com.f0xy.test", {

	SingletonTest : f0xy.extend("f0xy.Singleton", {

		testPropBool : true,
		testPropStr : "f0xy",
		testPropObj : {prop1 : "yay", prop2 : "awesome"},
		testPropArr : ["yay", "awesome"],

		init : function(){

		},

		someTestMethod : function(){
			return true;
		}

	})
});