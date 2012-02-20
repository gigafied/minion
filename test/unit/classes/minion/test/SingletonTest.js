minion.define("minion.test", {

	SingletonTest : minion.extend("minion.Singleton", {

		testPropBool : true,
		testPropStr : "minion",
		testPropObj : {prop1 : "yay", prop2 : "awesome"},
		testPropArr : ["yay", "awesome"],

		init : function(){
			this.sup();
		},

		someTestMethod : function(){
			return true;
		}

	})
});