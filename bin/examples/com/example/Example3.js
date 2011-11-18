f0xy.define("com.example", {

	Example3 : f0xy.extend("com.example.Example2", {

		test: 5,
		test2: 6,

		init: function(){
			
		},

		logSomething : function(something){
			console.log(com.example);
			this._super(something);
		}

	})
});