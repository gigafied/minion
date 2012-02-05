(function(){
	
	"use strict";

	minion.define("minion", {

		Singleton : minion.extend("minion.Class", {

			/**
			* A way to easily implement Singletons.
			*/
			init : function(){

			},
			
			__preInit : function(){
				if(this.constructor.__instance){
					return this.constructor.__instance;
				}
				
				this.init.apply(this, arguments);

				this.constructor.__instance = this;
				return this.constructor.__instance;
			},

			__static : {

				__isSingleton: true,

				/**
				*
				* Returns the instance of this Singleton. If this Class has not yet been instantiated, creates a new instance and returns that.
				* Otherwise, it returns the already existing reference.
				*/
				getInstance : function(){
					if(!this.__instance){
						var This = this;
						this.__instance =  new This();
						return this.__instance;
					}
					return this.__instance;
				}
			}

		})
	});
	
})();