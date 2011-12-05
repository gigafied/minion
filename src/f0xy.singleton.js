f0xy.define("f0xy", {

	/**
	*
	* Yep pretty much exactly what it seems like it does
	* 
	*/

	Singleton : f0xy.extend("f0xy.Class", {

		__isSingleton: true,

		__preInit : function(){
			if(this.constructor.__instance){
				return this.constructor.__instance;
			}
			
			this.init.apply(this, arguments);

			this.constructor.__instance = this;
			return this.constructor.__instance;
		},

		init : function(){

		},

		// You can add static methods and properties to a non static class through __static...
		__static : {

			getInstance : function(){
				if(!this.__instance){
					this.__instance =  new this();
					return this.__instance;
				}
				return this.__instance;
			}
		}
	})
});