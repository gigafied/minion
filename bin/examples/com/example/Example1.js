f0xy.define("com.example", {
	
	require: [
		"com.example.utils.ExampleUtils"
	],

	Example1 : f0xy.extend("f0xy.Class", {

		exampleVar1: 1,
		exampleVar2: 2,

		init: function(){
			f0xy.addInterest(this, "test");
		},

		logSomething : function(something){

			f0xy.get("com.example.utils.ExampleUtils").log(something);
		},

		handleNotification: function(notification, data){
			console.log(notification);
		}

	})
});