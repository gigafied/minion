(function(){

	var __instance;

	f0xy.define("f0xy", {

		/**
		*
		* Yep pretty much exactly what it seems like it does
		* 
		*/

		Singleton : f0xy.extend("f0xy.Class", {

			__isSingleton: true,

			init : function(){
				if(!__instance){
					__instance = this;
				}
				return __instance;
			},

			getInstance : function(){
				return this.init();
			}

		})
	});

})();