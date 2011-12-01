f0xy.define("com.example", {

	Singleton : f0xy.extend("f0xy.Singleton", {

		test: null,

		init: function(a){
			this.test = a;
			return this.__super();
			
		}
	})
});