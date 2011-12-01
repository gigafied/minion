f0xy.define("com.example", {

	Example3 : f0xy.extend("com.example.Example2", {

		init: function(){			
		},

		logSomething : function(something){
			this.notify("test");
			this.__super(something);
		}

	})
});