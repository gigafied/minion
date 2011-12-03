(function(){

	f0xy.define("f0xy", {

		/**
		*
		* Yep pretty much exactly what it seems like it does
		* 
		*/

		Singleton : f0xy.extend("f0xy.Class", {

			__isSingleton: true,

			init : function(){
				if(!this.constructor._instance){
					this.constructor._instance = this;
				}
				return this.constructor._instance;
			}
		})
	});

	f0xy.Singleton.prototype.getInstance = function(){
		if(!this._instance){
			return this.init.apply(this, Array.prototype.slice.call(arguments));
		}
		this._instance = new this.apply(this, Array.prototype.slice.call(arguments));
		return this._instance;
	}

})();
