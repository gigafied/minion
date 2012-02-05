(function(){
		
	"use strict";

	minion.define("minion", {

		Static : minion.extend("minion.Singleton", {

			__static : {
				__isDefined : true,
				__isStatic : true
				
			},

			/**
			* A way to easily implement Static Classes.
			*/
			init : function(){

			}

		})
	});
	
})();