(function(){

	f0xy.define("f0xy", {
		require: [
			"f0xy.Class"
		],

		/**
		*
		* Yep pretty much exactly what it seems like it does
		* 
		*/

		Static : (function() {

			var _staticClass = function() {;}

			_staticClass.__isDefined = true;
			_staticClass.__isStatic = true;

			_staticClass.__extend = function(obj){
				var _class = function() {;}

				for(var prop in obj){
					if(obj.hasOwnProperty(prop)){
						_class[prop] = obj[prop];
					}
				}

				for(var prop in this){
					if(this.hasOwnProperty(prop)){
						_class[prop] = this[prop];
					}
				}

				for(var prop in f0xy.Class.prototype){
					if(f0xy.Class.prototype.hasOwnProperty(prop)){
						_class[prop] = f0xy.Class.prototype[prop];
					}
				}

				return _class;
			}

			return _staticClass;

		})()

	});

})();