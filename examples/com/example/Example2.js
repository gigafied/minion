Rosy.namespace("com.example", {

	Example : Rosy.extend("com.example.Example1", {

		test: 3,
		test2: 4,

		init: function(){
			
		},

		logSomething : function(something){
			this._super(something);
		}

	})
});