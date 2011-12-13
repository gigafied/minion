f0xy.define("com.example", {
	
	require: [
		"com.example.utils.ExampleUtils"
	],

	Example1 : f0xy.extend("f0xy.Class", {

		exampleVar1: 1,
		exampleVar2: 2,

		init: function(){
			this.addInterest("test", this.handleTest);
		},

		logSomething : function(something){
			f0xy.get("com.example.utils.ExampleUtils").log(something);
		},

		handleTest : function(n){
			n.hold();
			console.log("holding notification");

			setTimeout(function(){
				console.log("releasing notification");
				n.release();
			}, 2000);
		}
	})
});