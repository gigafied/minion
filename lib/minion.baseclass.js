(function () {

	"use strict";

	/*=========================== HELPER FUNCTIONS ===========================*/

		var _createSuperFunction = function (fn, superFn) {
			return function() {
				var tmp = this.sup || null;

				// Reference the prototypes method, as super temporarily
				this.sup = superFn;

				var r = fn.apply(this, arguments);

				// Reset this.sup
				this.sup = tmp;
				return r;
			};
		};

		var _copyTo = function (obj) {
			while(arguments.length > 1) {
				var obj2 = Array.prototype.splice.call(arguments, 1, 1)[0];
				for (var prop in obj2) {
					obj[prop] = obj2[prop];
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
			var Class = function () {};
			// $$ is an object where any minion specific properties/values reside.
			Class.$$ = {isDefined: true};

			Class.extend = function (props, staticProps) {

				var p;

				dummy.prototype = this.prototype;
				var proto = _copyTo(new dummy(), props);

				function SubClass () {
					var fn = this.preInit || this.init || this.prototype.constructor;
					return fn.apply(this, arguments);
				}

				for(var p in props) {
					if (
						p !== "static" 
						&& typeof props[p] === "function" 
						&& typeof this.prototype[p] === "function" 
						&& _doesCallSuper.test(props[p])
					) {
						proto[p] = _createSuperFunction(props[p], this.prototype[p]);
					}
				}

				SubClass.prototype = proto;

				_copyTo(SubClass, this, props.static, staticProps);

				SubClass.prototype.constructor = SubClass.prototype.static = SubClass;

				return SubClass;
			};
			
			return Class;

		})()

	});

})();