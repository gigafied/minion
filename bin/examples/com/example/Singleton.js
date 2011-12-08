f0xy.define("com.example", {

	Singleton : f0xy.extend("f0xy.Singleton", {

		test: null,

		init: function(a){
			this.test = a;
			console.log("f00000");
			return this.__super();
			
		}
	})
});