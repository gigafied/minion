f0xy.define("com.f0xy.test", {

	Test1 : f0xy.extend("f0xy.Class", {

		testPropBool : true,
		testPropStr : "f0xy",
		testPropObj : {prop1 : "yay", prop2 : "awesome"},
		testPropArr : ["yay", "awesome"],		

		init : function(){

		},

		superTestMethod : function(){
			return true;
		}

	})
});