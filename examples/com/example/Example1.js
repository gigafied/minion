Rosy.namespace("com.example", {
	
	requires: [
		"com.example.utils.ExampleUtils"
	],

	Example : Rosy.extend("org.rosyjs.Class", {

		test: 1,
		test2: 2,

		init: function(){
			
		},

		logSomething : function(something){

			this.import_dependencies();

			ExampleUtils.log(something);
		}

	})
});