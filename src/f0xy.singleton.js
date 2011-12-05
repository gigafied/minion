f0xy.define("f0xy", {

	/**
	*
	* Yep pretty much exactly what it seems like it does
	* 
	*/

	Singleton : f0xy.extend("f0xy.Class", {

		__isSingleton: true,

		__preInit : function(){
			if(this.constructor.prototype._instance){return this.constructor.prototype._instance;}
			
			this.init();

			this.constructor.prototype._instance = this;
			return this.constructor.prototype._instance;
		},

		init : function(){

		},

		getInstance : function(){
			return this.__preInit();
		}
		
	})
});