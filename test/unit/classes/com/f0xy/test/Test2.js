f0xy.define("com.f0xy.test", {

	Test2 : f0xy.extend("com.f0xy.test.Test1", {

		init : function(){

		},

		someTestMethod : function(){
			return this.__super();
		}

	})
});