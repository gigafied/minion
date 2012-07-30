/*
 * minion.JS v1.5.5
 * http://minion.org
 *
 * (c) 2012, Taka Kojima (taka@gigafied.com)
 * Licensed under the MIT License
 *
 * Date: Mon Jul 30 13:12:13 2012 -0700
 */
 /**

@fileOverview

<h4>MinionJS - Cross-Platform & Cross-Browser JavaScript Inheritance</h4>

<p>Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:</p>

<p>The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.</p>

<p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.</p>
*/


/**
*	Global MinionJS Object with Static methods.
*
*	@namespace
*/

/*
	TODO:
		- Multiple inheritance
		- Independent library support, i.e. ability to do minion.require("minion.libs.jquery") to load jquery
		- AMD Compliant?
		- minion.provides("namespace.*");
		- __preDefine method on Classes, takes 1 argument, a callback that gets called once __preDefine does all it needs to do
*/

var minion = (function (root) {

	"use strict";

	// If Array.indexOf is not defined, let's define it.
	Array.prototype.indexOf = Array.prototype.indexOf || function (a, b) {
		if (!this.length || !(this instanceof Array) || arguments.length < 1) {
			return -1;
		}

		b = b || 0;

		if (b >= this.length) {
			return -1;
		}

		while (b < this.length) {
			if (this[b] === a) {
				return b;
			}
			b += 1;
		}
		return -1;
	};
	
	var _classMappings = [];
	var _aliases = ["minion"];

	var _separator = ".";
	var _class_path = "";
	var _file_suffix = "";

	var _initialized;

	var _loadQueue = [];
	var _extendQueue = [];

	var _waitID;
	var _waitingForLoad = [];
	var _loadedFiles = [];
	var _NotificationManager;
	var _waitInterval = 500;

	var _isNode = (typeof window === "undefined");

	var _root = root;
	var _ns = {};
	var _errorTimeout = 1e4;

	var _minion = {};	

	/*================= HELPER FUNCTIONS =================*/

	var _isArray = Array._isArray || function (a) {
		return a instanceof Array;
	};

	var _isObject = function (obj) {
		return typeof obj === "object";
	};

	var _isString = function (s) {
		return typeof s === 'string' || s instanceof String;
	};

	var _isFunction = function (fn) {
		return typeof fn === "function";
	};

	var _strToArray = function (s) {
		return (!_isArray(s)) ? [s] : s;
	};

	var _concatArray = function (a, b, forceUnique) {		
		b = b || [];
		if(!forceUnique){
			return a || [].concat(b);
		}

		// Force unique values
		b = [].concat(b);
		a = a || [];

		for(var i = 0, l = a.length; i < l; i += 1){
			if(b.indexOf(a[i]) < 0){
				b[b.length] = a[i];
			}
		}

		return b;
	};

	var _copyToNS = function(o1,o2){
		for (var i in o1) {
			if(o1.hasOwnProperty(i)){
				o2[i] = o1[i];
			}
		}
	};

	var _removeFromNS = function(o1,o2){
		for (var i in o1) {
			if(o1.hasOwnProperty(i)){
				o2[i] = null;
				delete o2[i];
			}
		}
	};


	// Recursively checks dependencies

	var _areDependenciesLoaded = function (o) {
		o = _minion.get(o, false);
		var i;

		if (!o.__isDefined) {
			return false;
		}
		if (o.__dependencies) {
			for (i = 0; i < o.__dependencies.length; i += 1) {
				if (!_areDependenciesLoaded(o.__dependencies[i])) {
					return false;
				}
			}
		}
		return true;
	};


	var _checkLoadQueue = function () {
		var i, j, q, dependenciesLoaded, classes, classesArray;
		q = {};
		classes = {};
		classesArray = [];

		for (i = _loadQueue.length - 1; i >= 0; i --) {

			q = _loadQueue[i];
			dependenciesLoaded = true;

			for (j = 0; j < q.c.length; j ++) {
				dependenciesLoaded = _areDependenciesLoaded(q.c[j]);
				if (!dependenciesLoaded) {
					break;
				}
			}

			if (dependenciesLoaded) {
				if (q.cb) {
					q.cb.apply(_root, _minion.get(q.c));
				}
				_loadQueue.splice(i, 1);
			}
		}
	};


	var _checkExtendQueue = function () {
		var eq = _extendQueue;
		var i, superClass, ns, id;

		for (i = eq.length - 1; i >= 0; i --) {

			ns = eq[i].split(_separator);
			id = ns.splice(ns.length - 1, 1)[0];
			ns = _minion.get(ns.join(_separator), false);

			if (ns[id].__toExtend) {
				superClass = _minion.get(ns[id].__extendedFrom, false);
				if (superClass.__isDefined) {

					ns[id].__toExtend = false;
					delete ns[id].__toExtend;

					ns[id] = _minion.extend(ns[id].__extendedFrom, ns[id]);

					eq.splice(i, 1);
					setTimeout(_checkExtendQueue, 0);
					return;
				}
			}
		}
		_checkLoadQueue();
	};


	var _checkWaitQueue = function () {

		var w = _waitingForLoad;
		var i, o;

		if (_waitID) {
			clearTimeout(_waitID);
		}

		for (i = 0; i < w.length; i += 1) {
			o = w[i];
			o.e += 50;
			
			if (_minion.isDefined(o.c)) {
				o.s.onload();
			}
			
			else if (o.e >= _errorTimeout) {
				o.s.onerror();
			}
		}

		if (w.length > 0) {
			_waitID = setTimeout(_checkWaitQueue, _waitInterval);
		}
	};

	/**
	* Injects a Script tag into the DOM
	*/

	var _inject = function(f, c) {

		var doc = document;
		var body = "body";

		var injectObj, script;

		if (!doc[body]) {
			return setTimeout(function(){
				_inject(f,c);
			}, 0);
		}

		script = doc.createElement("script");
		script.async = true;
	
		injectObj = {
			f : f,		// File
			c : c,		// Class
			e : 0,		// Elapsed Time
			s : script	// Script
		};

		_waitingForLoad.push(injectObj);

		script.onreadystatechange = /** @ignore */ script.onload = function (e) {
			if (_minion.isDefined(c)) {
				injectObj.s.onload = injectObj.s.onreadystatechange = null;
				injectObj.s.onerror = null;
				_waitingForLoad.splice(_waitingForLoad.indexOf(injectObj), 1);
			}
		};

		script.onerror = function (e) {
			injectObj.s.onerror = null;
			_waitingForLoad.splice(_waitingForLoad.indexOf(injectObj), 1);
			throw new Error(injectObj.c + " failed to load. Attempted to load from file: " + injectObj.f);
		};

		script.src = f;
		
		// Append the script to the document body
		doc[body].appendChild(script);
	};

	/**
	* Does all the loading of JS files
	*/

	var _load = function (q) {

		_loadQueue.push(q);

		for (var i = 0; i < q.f.length; i += 1) {

			if(_isNode){
				require(q.f[i]);
			}
			else{
				_inject(q.f[i], q.c[i]);
			}
		}

		/*
			If the load times out, fire onerror after the time defined by _errorTimeout (default is 10 seconds)
			(can be changed through minion.config({minion.errorTimeout : ms});
		*/
		_waitID = setTimeout(_checkWaitQueue, _waitInterval);
	};

	/**
	* Used by minion.get() and minion.define(). 
	* Get the namespace/Class, or creates it if it does not exist. Also optionally creates Objects in the specified namepsace.
	*/

	var _namespace = function (id, autoCreate, definitions) {
		id = id || "";
		definitions = definitions || false;

		var ns = _ns;
		var i;

		if (id && !_isObject(id) && !_isFunction(id)) {
			var parts = id.split(_separator);

			if (_aliases.indexOf(parts[0]) > -1) {
				ns = _minion;
				parts.splice(0,1);
			}

			for (i = 0; i < parts.length; i += 1) {
				if (!ns[parts[i]]) {
					if (autoCreate) {
						ns[parts[i]] = {};
					}
					else{
						return false;
					}
				}
				ns = ns[parts[i]];
			}
		}

		else if (id !== "") {
			ns = id;
		}
		else{
			return false;
		}

		if (definitions) {

			definitions.require = _concatArray(definitions.require);
			var cr = definitions.require;
		
			for (var className in definitions) {			

				if (className !== "require") {

					var qualifiedName = id + _separator + className;
					var c = definitions[className];

					if (c.__extendedFrom) {
						cr.push(c.__extendedFrom);
					}

					if (c.__toExtend) {				
						if (_extendQueue.indexOf(qualifiedName) < 0) {
							_extendQueue.push(qualifiedName);
						}
					}

					c.__static = c.__static || {};
				
					c.__nsID = id;
					c.__ns = ns;
					c.__class = className;

					if (cr.length > 0) {
						c.__dependencies = _concatArray(c.__dependencies, cr, true);
						_minion.require(cr);
					}

					if (_minion.isDefined(c) && c.prototype) {
						var proto = c.prototype;
						proto.__nsID = id;
						proto.__ns = ns;
						proto.__class = className;

						if (cr.length > 0) {
							proto.__dependencies = _concatArray(proto.__dependencies, cr, true);
						}
					}

					ns[className] = c;
				}
			}
		}

		return ns;
	};

	/*================= END OF HELPER FUNCTIONS =================*/


	/**
	* Configure minion.
	*/

	_minion.configure = function (configObj) {
		
		configObj = configObj || {};

		_class_path = configObj.classPath || _class_path;
		_class_path = (_class_path.lastIndexOf("/") === _class_path.length - 1) ? _class_path : _class_path + "/";

		_separator = configObj.separator || _separator;
		_file_suffix = configObj.fileSuffix || _file_suffix;

		if(configObj.paths){
			for(var i = 0; i < configObj.paths.length; i ++){
				var m = configObj.paths[i];
				_minion.provides(m.file, m.classes);
			}
		}

		_initialized = true;
	};

	/**
	* Alias minion under a different namespace. I.e. var woot = minion.alias("woot");
	*/

	_minion.alias = function (alias) {
		_aliases.push(alias);
		return _minion;
	};

	_minion.getAliases = function () {
		return _aliases;
	};

	_minion.separator = function () {
		return _separator;
	};

	/**
	* Gets the object by it's fully qualified identifier.
	*/

	_minion.get = function (id) {
		if(!_isArray(id)){
			return _namespace(id, false);
		}
		else{
			var classes = _minion.use(id, {});
			var classesArray = [];

			for (var c in classes) {
				if(classes.hasOwnProperty(c)) {
					classesArray.push(classes[c]);
				}	
			}

			return classesArray;
		}
	};

	/**
	* Defines Classes under the given namespace.
	*/
	_minion.define = function (id, definitions) {
		var r = _namespace(id, true, definitions);
		_checkExtendQueue();
		return r;
	};

	/**
	* Gets the URL for a given identifier.
	*/

	_minion.getURL = function (id) {

		if (_classMappings[id]) {
			return _classMappings[id];
		}

		var isDir = id.indexOf("*") > -1;
		id = isDir ? id.replace(".*", "") : id;
		var url = _class_path + id.replace(new RegExp('\\' + _separator, 'g'), '/') + (isDir ? "" : '.js') + ((_file_suffix) ? "?" + _file_suffix : "");

		return url;
	};

	/**
	* Checks to see whether the given fully qualified name or Object is defined as a minion class. (Checks for .__isDefined)
	* NOTE: Classes that have not yet loaded all of their dependencies, will return FALSE for this check.
	*/

	_minion.isDefined = function (id) {
		id = (!_isObject(id) && !_isFunction(id)) ? _namespace(id, false) : id;
		return (id) ? id.__isDefined : false;
	};

	/**
	* Extends a given class asynchronously.
	*/ 

	_minion.extend = function (id, obj) {
	
		// If the Class exists and is a minion class, then return the extended object.
		if (_minion.isDefined(id)) {
			obj = _minion.get(id).__extend(obj);
		}
		else{
			obj.__toExtend = true;
		}

		obj.__extendedFrom = id;

		return obj;
	};

	/**
	* Tells minion that filePath provides the class definitions for these classes.
	* Useful in cases where you group specific things into minfiied js files.
	*/

	_minion.provides = function (file, definitions) {

		// If classes is a String, create an array
		definitions = _strToArray(definitions);

		// If the file is not absolute, prepend the _class_path
		//file = (!new RegExp("(http://|/)[^ :]+").test(file)) ? _class_path + file : file;

		for (var i = 0; i < definitions.length; i += 1) {
			_classMappings[definitions[i]] = file;
		}
	};

	/**
	* Asyncrhonously loads in js files for the classes specified.
	* If the classes have already been loaded, or are already defined, the callback function is invoked immediately.
	*/

	_minion.require = function (ids, callback) {
		if (!_initialized) {
			_minion.configure();
		}

		ids = _strToArray(ids);
	
		var fileList = [];
		var classList = [];

		for (var i = 0; i < ids.length; i ++) {

			var id = ids[i];
			var file = _minion.getURL(id);
			var get = _minion.get(id);

			classList.push(id);
			
			if ((_loadedFiles.indexOf(file) < 0) && !_minion.get(id)) {
				fileList.push(file);				
				_loadedFiles.push(file);
			}
		}

		if (fileList.length > 0) {

			var q = {
				f	: fileList,
				c	: classList,
				cb : callback
			};
									
			//_load(q);
			setTimeout(function(){_load(q);}, 0);
		}

		else if (callback) {
			callback.apply(_root, _minion.get(ids));
		}
	};

	/**
	* Copies an array of classes (by their fully qualified names) to the specified object/scope.
	*
	* By calling minion.use("test.Example", obj), you will be able to refer to test.Example as just obj.Example.
	* 
	* Identifiers can contain the* wildcard character as its last segment (eg: test.*) 
	* which will import all Classes under the given namespace.
	*/

	_minion.use = function (ids, scope) {

		ids = ids || [];
		ids = _strToArray(ids);
		scope = scope || _ns;

		if (scope === _ns) {
			_minion.unuse();
		}

		var i, id, obj, ns, n;

		for (i = 0; i < ids.length; i += 1) {

			id = ids[i];

			obj = _minion.get(id, true);
			ns = id.split(_separator);
			id = ns.splice(ns.length - 1, 1)[0];
			ns = _minion.get(ns.join(_separator), false);

			if (id === '*') {
				// injects all ids under namespace into the root namespace
				for (n in ns) {
					if(ns.hasOwnProperty(n)){
						scope[n] = ns[n];
					}
				}
			}
			else{
				// injects this id into the root namespace
				if (ns[id]) {
					scope[id] = ns[id];
				}
			}
		}

		return scope;		
	};
	
	// Like jQuery .proxy, or ES5 .bind, just a way to make sure it's there cross-browser.
	_minion.proxy = function (fn, scope) {
		if(fn) {

			var bind = function (context) {
				if (!context) {return this;}
				var this_ = this;
				return function() {
					return this_.apply(context, Array.prototype.slice.call(arguments));
				};
			};

			if(Function.prototype.bind){
				return fn.bind(scope);
			}

			return bind.call(fn, scope);
		}
		return fn;
	};


	_minion.enableNotifications = function () {
		if (_minion.isDefined("minion.NotificationManager")) {
			if (!_NotificationManager) {

				var NM = _NotificationManager = (minion.get("minion.NotificationManager"));

				_minion.subscribe = _minion.proxy(NM.subscribe, NM);
				_minion.unsubscribe = _minion.proxy(NM.unsubscribe, NM);
				_minion.publish = _minion.proxy(NM.publish, NM);
				_minion.publishNotification = _minion.proxy(NM.publishNotification, NM);
				_minion.holdNotification = _minion.proxy(NM.holdNotification, NM);
				_minion.releaseNotification = _minion.proxy(NM.releaseNotification, NM);
				_minion.cancelNotification = _minion.proxy(NM.cancelNotification, NM);

			}
		}
	};

	/*
	Define minion as an AMD module, if define is defined (and has .amd as a property)
	*/
	if (typeof _root.define === "function" && _root.define.amd) {
		_root.define([], function () {
			return _minion;
		});
	}

	// Export for node
	if (_isNode){
		module.exports = _minion;
	}

	return _minion;

})(this);(function(){

	"use strict";

	//* @ignore */
	minion.define("minion", {

		/**
			The minion Base Class
			Classical JavaScript Inheritance (or an attempt thereof)
			minion.Class is the ONLY Class to extend this directly, do not directly extend this Class.
			Largely taken from: http://ejohn.org/blog/simple-javascript-inheritance/
		*/

		__BaseClass__ : (function() {

			/*
				Attempts to shallow copy objects, so as to not have a bunch of references lying around in object instances
				Otherwise, it is bad news bears doing something like this.nArray.push() in a Class method
				because it modifies nArray on prototype, and thus any other instances of said Class
			*/

			var _copyTo = function (obj) {
				while(arguments.length > 1) {
					var prop, obj2, v = Array.prototype.splice.call(arguments, 1, 1)[0];

					for (prop in obj2) {
						v = obj2[prop];
						if (v instanceof Date) {
							return new Date().setTime(v.getTime());
						}

						if (typeof v === "object") {
							if (v instanceof Array) {
								obj[prop] = v.concat();
							}
							else {
								obj[prop] = _copyTo({}, v);
							}
						}
						else {
							obj[prop] = v;
						}
					}
				}
				return obj;
			};

			var _createSuperFunction = function (fn, superFn) {
				return function() {
					var tmp = this.__super || null;

					// Reference the prototypes method, as super temporarily
					this.__super = superFn;

					var ret = fn.apply(this, arguments);

					// Reset this.__super
					if(tmp){this.__super = tmp;}
					else{this.__super = null; delete this.__super;}
					return ret;
				};
			};

			// Checks the function contents to see if it has a reference to __super
			var _doesCallSuper = /xyz/.test(function(){var xyz;}) ? /\b__super\b/ : /.*/;

			var _baseClass = function(){};

			_baseClass.__isDefined = true;

			_baseClass.__extend = function(obj) {

				// By passing "__no_init__" as the first argument, we skip calling the constructor and other initialization;
				var This = this;
				var _proto = new This("__no_init__");
				var _perInstanceProps = {};
				var _this = this;

				_proto['__dependencies'] = [].concat((this['__dependencies'] || []), (obj['__dependencies'] || []));

				// Copy the object's properties onto the prototype
				for(var name in obj) {

					if(obj.hasOwnProperty(name)) {

						if(name !== "__static" && name !== "__dependencies"){
							// If we're overwriting an existing function that calls this.__super, do a little super magic.
							if(typeof obj[name] === "function" && typeof _proto[name] === "function" && _doesCallSuper.test(obj[name])){
								_proto[name] = _createSuperFunction(obj[name], _proto[name]);
							}
							else{
								_proto[name] = obj[name];
							}
						}

						/*
							If it's an array or an object, we need to make a per instance copy of these values, so as to not affect other
							instances when dealing with Arrays or Objects.
						*/
						else if (typeof obj[name] === "object" && name.indexOf("__") !== 0) {
							_perInstanceProps[name] = obj[name];
						}
					}
				}

				var _class = function() {
					
					if(arguments[0] !== "__no_init__"){

						/*
							Handy for referencing dependencies. If a Class requires example.Test, then you can reference said class
							in any method by this.__imports.Test;

						*/
						if(!_class.prototype.hasOwnProperty("__imports")){
							_class.prototype.__imports = minion.use(this.__dependencies, {});
						}

						if(!this.__preInit){

							for (var attr in _perInstanceProps) {
								if (_perInstanceProps.hasOwnProperty(attr)) {
									this[attr] = _copyTo({}, _perInstanceProps[attr]);
								}
							}

							// All real construction is actually done in the init method
							return this.init.apply(this, arguments);
						}
						
						else{
							return this.__preInit.apply(this, arguments);
						}

					}
				};

				// Set the prototype and Constructor accordingly.
				_class.prototype = _proto;
				//* @ignore */
				_class.prototype.constructor = _class;

				// Expose the extend method
				//* @ignore */
				_class.__extend = _baseClass.__extend;

				_class.prototype.__extend = (function(scope, fn){
					return function(){
						return fn.apply(scope, arguments);
					};
				})(_class, _class.__extend);

				/*
					Custom minion properties, anything beginning with an __ on a Class or instance, is populated and used by minion.
					The "__" prefix is used to avoid naming conflictions with developers, and allows
					us to not have to impose a list of reserved words on developers.
				*/

				_class.__ns = obj.__ns || "";
				_class.__nsID = obj.__nsID || "";
				_class.__class = obj.__class || "";
				_class.__dependencies = obj.__dependencies || [];

				/*
					Add all static methods and properties that are defined in the __static object.
					Only write to it if it doesn't already exist, to disable overwriting things we actually need for minion by malicious or
					plain bad code.
				*/
				var prop;

				if(obj.__static){
					_class.__static = _class.__static || {};
					for(prop in obj.__static){
						if(!_class[prop]){
							_class[prop] = obj.__static[prop];
							_class.__static[prop] = obj.__static[prop];
						}
					}
					_class.__static = obj.__static;
				}

				if(this.__static){
					_class.__static = _class.__static || {};				
					for(prop in this.__static){
						if(!_class[prop]){
							_class[prop] = this.__static[prop];
							_class.__static[prop] = this.__static[prop];
						}
					}
				}

				if(_class.__static.__isStatic){
					
					var StaticClass = _class;
					var s = new StaticClass();

					s.__static = _class.__static;

					for(prop in _class.__static){
						s[prop] = _class.__static[prop];
					}

					return s;
				}

				return _class;
			};
			
			return _baseClass;

		})()
	});

})();(function() {
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Class# */ 

		Class : minion.extend("minion.__BaseClass__", {

			__static : {
				__isDefined: true
			},

			/**		
			* The base minion Class. All Classes are required to be descendants
			* of this class, either directly, or indirectly.
			*/

			init: function() {

			},
			
			/** 
			* Local version of window.setTimeout that keeps scope of <i>this</i>.<br>
			*/
			setTimeout : function(func, delay) {
				return setTimeout(this.proxy(func), delay);
			},

			/** 
			* Local version of window.setInterval that keeps scope of <i>this</i>.<br>
			*/
			setInterval : function(func, delay) {
				return setInterval(this.proxy(func), delay);
			},

			/** 
			* Shorthand for func.bind(this)
			* or rather, $.proxy(func, this) in jQuery terms
			*/
			proxy : function(fn) {
				return minion.proxy(fn, this);
			},
			
			/** 
			* Subscribes to a notification.
			*/

			subscribe : function(name, handler, priority) {
				if(!this._interestHandlers) {
					this._interestHandlers = [];
				}

				if(handler && !this._interestHandlers[name]) {
					handler = this.proxy(handler);
					minion.subscribe(handler, name, priority);
					this._interestHandlers[name] = handler;
				}
			},

			/** 
			* Unsubscribes from a notification.
			*/

			unsubscribe : function(name) {
				if(this._interestHandlers && this._interestHandlers[name]) {
					var handler = this._interestHandlers[name];
					this._interestHandlers[name] = null;
					delete this._interestHandlers[name];
				}
				minion.unsubscribe(handler, name);
			},

			/**
			* Unsubscribes from all notifications registered via this.subscribe();
			*/

			unsubscribeAll : function() {
				for(var interest in this._interestHandlers) {
					if(this._interestHandlers.hasOwnProperty(interest)) {
						this.unsubscribe(interest);
					}
				}
				this._interestHandlers = [];
			},

			/** 
			* Publishes a notification with the specified data.
			*/

			publish : function(name, data, callback) {
				minion.publish(name, data, this, callback);
			}
			

		})
	});

})();(function(){
	
	"use strict";

	minion.define("minion", {

		Singleton : minion.extend("minion.Class", {

			/**
			* A way to easily implement Singletons.
			*/
			init : function(){

			},
			
			__preInit : function(){
				if(this.constructor.__instance){
					return this.constructor.__instance;
				}
				
				this.init.apply(this, arguments);

				this.constructor.__instance = this;
				return this.constructor.__instance;
			},

			__static : {

				__isSingleton: true,

				/**
				*
				* Returns the instance of this Singleton. If this Class has not yet been instantiated, creates a new instance and returns that.
				* Otherwise, it returns the already existing reference.
				*/
				getInstance : function(){
					if(!this.__instance){
						var This = this;
						this.__instance =  new This();
						return this.__instance;
					}
					return this.__instance;
				}
			}

		})
	});
	
})();(function(){
		
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
	
})();(function(){
	
	"use strict";

	var Notification = function(name, data, callback) {
		this.name = name;
		this.data = data;
		this.callback = callback;
	}

	Notification.prototype.data = {};
	Notification.prototype.name = "";
	Notification.prototype.dispatcher = null;
	Notification.prototype.status = 0;
	Notification.prototype.pointer = 0;
	Notification.prototype.callback = null;

	Notification.prototype.hold = function() {
		this.status = 2;
	};

	Notification.prototype.release = function() {
		this.status = 1;
		minion.releaseNotification(this);
	};

	Notification.prototype.cancel = function() {
		this.data = {};
		this.name = "";
		this.status = 0;
		this.pointer = 0;
		this.dispatcher = null;
		this.callback = null;

		NotificationManager.cancelNotification(this);
	};

	Notification.prototype.dispatch = function(obj) {
		this.status = 1;
		this.pointer = 0;
		this.dispatcher = obj;
		NotificationManager.publishNotification(this);
	};


	Notification.prototype.respond = function(obj) {
		if(this.callback) {
			this.callback.apply(this.dispatcher, arguments);
			this.cancel();
		}
	};

	var pendingNotifications = [];
	var interests = {};


	minion.define("minion", {

		/*
			This Class handles all the nitty gritty Notification stuff.
		*/

		NotificationManager : minion.extend("minion.Static", {

			
			subscribe : function(fn, name, priority) {
				
				priority = isNaN(priority) ? -1 : priority;
				interests[name] = interests[name] || [];

				if(priority <= -1 || priority >= interests[name].length){
					interests[name].push(fn);
				}
				else{
					interests[name].splice(priority, 0, fn);
				}
			},

			unsubscribe : function(fn, name) {
				if(name instanceof Array){
					for(var i = 0; i < name.length; i ++){
						this.unsubscribe(fn, name[i]);
					}
					return;
				}
				var fnIndex = interests[name].indexOf(fn);
				if(fnIndex > -1){
					interests[name].splice(fnIndex, 1);
				}
			},
			
			publish : function(notification, data, obj, callback) {
				notification = new Notification(notification, data, callback);
				notification.status = 1;
				notification.pointer = 0;
				notification.dispatcher = obj;
				this.publishNotification(notification);
			},

			publishNotification : function(notification) {
				var name = notification.name;

				pendingNotifications.push(notification);
				this._notifyObjects(notification);
			},
			
			_notifyObjects : function(notification) {

				var name = notification.name;
				var subs = interests[name].splice(0);
				var len = subs.length;

				while(notification.pointer < len) {
					if(notification.status == 1){
						subs[notification.pointer](notification);
						notification.pointer ++;
					}
					else{
						return;
					}
				}

				subs = null;

				/*
					Notified all subscribers, notification is no longer needed,
					unless it has a callback to be called later via notification.respond()
				*/
				if(notification.status === 1 && !notification.callback) {
					notification.cancel();
				}
			},
						
			releaseNotification : function(notification) {
				notification.status = 1;
				if(pendingNotifications.indexOf(notification) > -1){
					this._notifyObjects(notification);
				}
			},
			
			cancelNotification : function(notification) {
				var name = notification.name;
				pendingNotifications.splice(pendingNotifications.indexOf(notification), 1);
				notification = null;
			}

		})

	});

	var NotificationManager = minion.get("minion.NotificationManager");

	minion.enableNotifications();

})();
