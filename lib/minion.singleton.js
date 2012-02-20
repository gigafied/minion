(function(){
	
	"use strict";

	minion.define("minion", {

		Singleton : minion.extend("minion.Class", {

			/**
			* A way to easily implement Singletons.
			*/
			init : function(){

			},
			
			preInit : function(){
				if(this.constructor.__instance){
					return this.constructor.__instance;
				}
				
				this.init.apply(this, arguments);

				this.constructor.__instance = this;
				return this.constructor.__instance;
			},

			static : {

				/**
				* Returns the instance of this Singleton. If this Class has not yet been instantiated,
				* creates a new instance and returns that. Otherwise, it returns the already existing reference.
				*/

				getInstance : function(){
					if(!this.__instance){
						var This = this;
						return this.__instance =  new This();
					}
					return this.__instance;
				}
			}

		})
	});
	
})();