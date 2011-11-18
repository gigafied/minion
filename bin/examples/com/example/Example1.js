f0xy.define("com.example", {
	
	require: [
		"com.example.utils.ExampleUtils"
	],

	Example1 : f0xy.extend("f0xy.Class", {

		test: 1,
		test2: 2,

		init: function(){
			
		},

		logSomething : function(something){

			this.use_dependencies();

			ExampleUtils.log(something);
		}

	})
});