minion.define("minion.test", {

	Test2 : minion.extend("minion.test.Test1", {

		init : function(){

		},

		someTestMethod : function(){
			return true;
		},

		superTestMethod : function(){
			return this.__super();
		}

	})
});