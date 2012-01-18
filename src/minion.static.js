(function(){
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Static# */ 

		Static : minion.extend("minion.Singleton", {

			__static : {
				__isDefined : true,
				__isStatic : true
				
			},

			/**
			*
			* A way to easily implement Static Classes.
			*
			* @constructs
			* @extends minion.Singleton
			*/
			init : function(){

			}

		})
	});
	
})();