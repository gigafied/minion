(function () {

	"use strict";

	/*=========================== HELPER FUNCTIONS ===========================*/

		var _createSuperFunction = function (fn, superFn) {
			return function() {
				var tmp = this.sup || null;

				// Reference the prototypes method, as super temporarily
				this.sup = superFn;

				var ret = fn.apply(this, arguments);

				// Reset this.__super
				if(tmp){this.sup = tmp;}
				else{this.sup = null; delete this.sup;}
				return ret;
			};
		};

		var _copyTo = function (obj) {

			for(var i = 1; i < arguments.length; i ++) {

				var obj2 = arguments[i];

				if (obj2) {
					for (var p in obj2) {
						obj[p] = obj2[p];
					}
				}

			}
			return obj;		
		};

		/*
			If Function.toString() works as expected, return a regex that checks for `sup()`
			otherwise return a regex that passes everything.
		*/

		var _doesCallSuper = /xyz/.test(function(){var xyz;}) ? /\bthis\.sup\b/ : /.*/;

	/*=========================== END OF HELPER FUNCTIONS ===========================*/


	minion.define("minion", {

		BaseClass : (function() {

			// Setup a dummy constructor for prototype-chaining without any overhead.
			var dummy = function () {};
			var baseClass = function () {};
			// $$ is an object where any minion specific properties/values reside.
			baseClass.$$ = {isDefined: true};

			baseClass.extend = function (props, staticProps) {

				var subClass;
				var parentClass = this;
				var p;

				if (props && props.hasOwnProperty("init")) {
					if (props && props.hasOwnProperty("preInit")) {
						subClass = props.preInit;
					}
					else{
						subClass = props.init;
					}
				}

				else{
					subClass = function () {
						parentClass.apply(this, arguments);
					};
				}

				dummy.prototype = parentClass.prototype;
				subClass.prototype = new dummy();

				_copyTo(subClass.prototype, props);

				for(p in props) {			
					if(p !== "static" && typeof props[p] === "function" && typeof subClass.prototype[p] === "function" && _doesCallSuper.test(props[p])){
						subClass.prototype[p] = _createSuperFunction(props[p], subClass.prototype[p]);
					}
				}

				subClass.prototype.constructor = subClass;
				subClass.prototype.static = subClass;

				_copyTo(subClass, props.static, staticProps, parentClass);

				return subClass;
			};
			
			return baseClass;

		})()

	});

})();