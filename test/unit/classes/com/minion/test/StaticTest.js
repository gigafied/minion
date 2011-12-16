minion.define("com.minion.test", {

	StaticTest : minion.extend("minion.Static", {

		testPropBool : true,
		testPropStr : "minion",
		testPropObj : {prop1 : "yay", prop2 : "awesome"},
		testPropArr : ["yay", "awesome"],

		someTestMethod : function(){
			return true;
		}

	})
});