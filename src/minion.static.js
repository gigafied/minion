(function(){
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Static# */ 

		Static : minion.extend("minion.Singleton", {

			/**
			*
			* A way to easily implement Static Classes.
			*
			* @constructs
			* @extends minion.Singleton
			*/
			init : function(){

			},
			
			/** @ignore */
			__static : {

				/** @lends minion.Static# */ 
				__isStatic: true
			}

		})
	});
	
})();