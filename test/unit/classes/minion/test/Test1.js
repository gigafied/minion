minion.define("minion.test", {

	Test1 : minion.extend("minion.Class", {

		testPropBool : true,
		testPropStr : "minion",
		testPropObj : {prop1 : "yay", prop2 : "awesome"},
		testPropArr : ["yay", "awesome"],		

		init : function(){
			//
		},

		superTestMethod : function(){
			return true;
		}

	})
});