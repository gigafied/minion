(function(){

	f0xy.define("f0xy", {

		/**
		*
		* Yep pretty much exactly what it seems like it does
		* 
		*/

		Static : {

			__isDefined : true,
			__isStatic : true,

			__extend : function(obj){
				obj.prototype = this;
				return obj;
			}
		}

	});

})();