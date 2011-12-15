f0xy.define("com.f0xy.test", {

	StaticTest : f0xy.extend("f0xy.Static", {

		testPropBool : true,
		testPropStr : "f0xy",
		testPropObj : {prop1 : "yay", prop2 : "awesome"},
		testPropArr : ["yay", "awesome"],

		someTestMethod : function(){
			return true;
		}

	})
});