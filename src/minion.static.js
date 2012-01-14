(function(){
	
	"use strict";

	minion.define("minion", {

		require: [
			"minion.Class"
		],

		Static : (function() {

			var _staticClass = function() {
				throw new Error("This is a Static Class. Don't instantiate this Class.");
			};

			_staticClass.__isDefined = true;
			_staticClass.__isStatic = true;

			_staticClass.__extend = function(obj){
				var _class = function() {
					throw new Error("This is a Static Class. Don't instantiate this Class.");
				};
				
				var prop;

				for(prop in minion.Class.prototype){
					if(minion.Class.prototype.hasOwnProperty(prop)){
						_class[prop] = minion.Class.prototype[prop];
					}
				}

				for(prop in this){
					if(this.hasOwnProperty(prop)){
						_class[prop] = this[prop];
					}
				}

				for(prop in obj){
					if(obj.hasOwnProperty(prop)){
						_class[prop] = obj[prop];
					}
				}

				return _class;
			};

			return _staticClass;

		})()

	});
	
})();