f0xy.define("com.example", {
	
	require: [
		"com.example.utils.ExampleUtils"
	],

	Example1 : f0xy.extend("f0xy.Class", {

		exampleVar1: 1,
		exampleVar2: 2,

		init: function(){
			
		},

		logSomething : function(something){

			f0xy.get("com.example.utils.ExampleUtils").log(something);
		}

	})
});