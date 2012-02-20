(function () {
	
	"use strict";

	minion.define("minion", {

		Singleton : minion.extend("minion.Class", {

			/**
			* A way to easily implement Singletons.
			*/
			init : function () {

			},
			
			preInit : function () {
				if (!this.static.$$.instance) {
					this.init.apply(this, arguments);
					this.static.$$.instance = this;
				}
				return this.static.$$.instance;
			},

			static : {

				/**
				* Returns the instance of this Singleton. If this Class has not yet been instantiated,
				* creates a new instance and returns that. Otherwise, it returns the already existing reference.
				*/

				getInstance : function () {
					if(!this.$$.instance) {
						var This = this;
						this.$$.instance = new This();
					}
					return this.$$.instance;
				}
			}

		})
	});
	
})();