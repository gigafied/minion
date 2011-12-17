	(function(){
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Singleton# */ 

		Singleton : minion.extend("minion.Class", {

			/**
			*
			* A way to easily implement Singletons.
			*
			* @constructs
			* @extends minion.Class
			*/
			init : function(){

			},
			
			/** @ignore */
			__preInit : function(){
				if(this.constructor.__instance){
					return this.constructor.__instance;
				}
				
				this.init.apply(this, arguments);

				this.constructor.__instance = this;
				return this.constructor.__instance;
			},

			/** @ignore */
			__static : {

				/** @lends minion.Singleton# */ 
				__isSingleton: true,

				/**
				*
				* Returns the instance of this Singleton. If this Class has not yet been instantiated, creates a new instance and returns that.
				* Otherwise, it returns the already existing reference.
				*
				* @memberOf minion.Singleton#
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