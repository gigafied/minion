f0xy.define("f0xy", {

	/**
	* The f0xy Base Class
	* Simple JavaScript Inheritance
	*
	* Taken from: http://ejohn.org/blog/simple-javascript-inheritance/
	* MIT Licensed.
	*
	* @class
	* @private
	* @ignore
	*/ 

	// ## f0xy Base Class.
	// f0xy.Class is the ONLY Class to extend this directly, do not directly extend this Class.

	$$__BaseClass__$$ : (function(doInitialize){
		
		// The base Class implementation (does nothing)
		var _BaseClass = function(){};

		_BaseClass.isClass = true;

		// Create a new Class that inherits from this class
		_BaseClass.extend = function extend(obj){
			
			// We set this to false, so we don't initialize a new instance every time we extend a Class.
			doInitialize = false;
			var prototype = new this();
			// Set it back to true, now that our "prototype" instance exists.
			doInitialize = true;

			// Make a deep copy of this object, removing all references that might affect other instances.
			var _this = this;

			if(prototype.dependencies){
				obj.dependencies = obj.dependencies || [];
				obj.dependencies = obj.dependencies.concat(prototype.dependencies);
			}

			// Copy the properties over onto the new prototype
			for(name in obj){
				// Check if we're overwriting an existing function
				prototype[name] = (typeof obj[name] === "function") && (typeof _this.prototype[name] === "function") ? (function (name, fn) {
					return function(){
						this._super = _this.prototype[name];
						var ret = fn.apply(this, arguments);
						this._super = null;
						delete this._super;
						f0xy.unuse();
					};
				}(name, obj[name])) : obj[name];
			}

			// The dummy class constructor
			var Class = function(){

				// All construction is actually done in the init method
				if(doInitialize && this.init){
					this.init.apply(this, arguments);
				}
			}

			// Populate our constructed prototype object
			Class.prototype = prototype;

			// Enforce the constructor to be what we expect
			Class.constructor = Class;

			// And make this class extendable
			Class.extend = extend;
			Class.isClass = true;

			if(obj.ns){
				Class.ns = obj.ns;
			}
			
			if(obj.nsID){
				Class.nsID = obj.nsID;
			}
			
			if(obj.className){
				Class.className = obj.className;
			}

			if(obj.dependencies){
				Class.dependencies = obj.dependencies;
			}

			return Class;
		};
		
		return _BaseClass;
	})()
});