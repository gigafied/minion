/*
 * minion.JS v1.4.3
 * http://minion.org
 *
 * (c) 2011, Taka Kojima
 * Licensed under the MIT License
 *
 * Date: Sat Jan 21 23:49:03 2012 -0800
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
	var _notificationManager;
	var _waitInterval = 500;

	var _isNode = (typeof window === "undefined");

	var _root = root;
	var _ns = {};
	var _errorTimeout = 1e4;

	/**
	* @exports _minion as minion 
	* @class
	*/
	var _minion = {};	

	/*================= HELPER FUNCTIONS =================*/

	/** @private */
	var _isArray = Array._isArray || function (a) {
		return a instanceof Array;
	};

	/** @private */
	var _isObject = function (obj) {
		return typeof obj === "object";
	};

	/** @private */
	var _isString = function (s) {
		return typeof s === 'string' || s instanceof String;
	};

	/** @private */
	var _isFunction = function (fn) {
		return typeof fn === "function";
	};

	/** @private */
	var _strToArray = function (s) {
		return (!_isArray(s)) ? [s] : s;
	};

	/** @private */
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

	/** @private */
	var _copyToNS = function(o1,o2){
		for (var i in o1) {
			if(o1.hasOwnProperty(i)){
				o2[i] = o1[i];
			}
		}
	};

	/** @private */
	var _removeFromNS = function(o1,o2){
		for (var i in o1) {
			if(o1.hasOwnProperty(i)){
				o2[i] = null;
				delete o2[i];
			}
		}
	};


	// Recursively checks dependencies
	/** @private */
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

	/** @private */
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

	/** @private */
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

	/** @private */
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
	*
	* @param		f		The path of the file to inject.
	* @param		c		The class which maps to the file we are injecting.
	* @private 
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

		/** @ignore */
		script.onreadystatechange = /** @ignore */ script.onload = function (e) {
			if (_minion.isDefined(c)) {
				injectObj.s.onload = injectObj.s.onreadystatechange = null;
				injectObj.s.onerror = null;
				_waitingForLoad.splice(_waitingForLoad.indexOf(injectObj), 1);
			}
		};

		/** @ignore */
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
	*
	* @param		q		The queue to be loaded
	* @private 
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
	*
	* @param			{String|Object}id						The fully qualified namespace.
	* @param			{Boolean}		autoCreate			Whether or not to create a blank object if the namespace does not yet exist.
	* @param			{Object}			[definitions]			An object of class definitions which will be added to the namespace.
	* @returns		{Object}									The object that represents the fully qualified namespace passed in as the first argument.
	* @private
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
	* 
	* @public
	* @param			{Object}		configObj			Configuration object, possible properties are : classPath, separator and fileSuffix
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
	* 
	* @public
	* @param			{String}		alias			The name of the namespace to alias minion under.
	*/

	_minion.alias = function (alias) {
		_aliases.push(alias);
		return _minion;
	};

	/**
	* Gets the object by it's fully qualified identifier.
	*
	* @public
	* @param			{String}				id						The identifier to get
	* @returns		{Object|Boolean}							The object that represents the identifier or false if it has not yet been defined.
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
	*
	* @public
	* @param			{String}			id						The namespace to define the Classes under.
	* @param			{Object}			[definitions]		An object of class definitions which will be added to the namespace
	* @returns		{Object}									The object that represents the namespace passed in as the first argument.
	*/
	_minion.define = function (id, definitions) {
		var r = _namespace(id, true, definitions);
		_checkExtendQueue();
		return r;
	};

	/**
	* Gets the URL for a given identifier.
	*
	* @public
	* @param			{String}		id						The fully qualified name to look up.
	* @returns		{String}								The URL of the file that maps to the fully qualified name.
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
	* Checks to see whether the given fully qualified name or Object is defined as a minion class. (Checks for .__isDefined)<br>
	* NOTE: Classes that have not yet loaded all of their dependencies, will return FALSE for this check.
	*
	* @public
	* @param			{String|Object}	id						The fully qualfied class name, or an Object.
	* @returns		{Boolean}									Whether or not this is defined.
	*/

	_minion.isDefined = function (id) {
		id = (!_isObject(id) && !_isFunction(id)) ? _namespace(id, false) : id;
		return (id) ? id.__isDefined : false;
	};

	/**
	* Extends a given class asynchronously.
	*
	* @public
	* @param			{String}		id						The fully qualified name of the Class you want to extend.
	* @param			{Object}		obj					A new Class Object
	* @returns		{Object}								The extended Class, or, if still waiting on dependencies, the original Object with a few more properties for internal minion use.
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
	*
	* @public
	* @param		{String}				file					The path of a JS file.
	* @param		{String|Array}		definitions			Fully qualfiied name(s) of class(es)
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
	*
	* @public
	* @param		{String|Array}		ids				The fully qualified name(s) of the class(es) to load.
	* @param		{Function}			callback			The function to call once all classes (and their dependencies) have been loaded.
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
	*
	* @public
	* @param		{String|Array}		ids		The fully qualfiied name(s) to import into the global namespace.
	* @param		{Object=[root]}				The scope to use.
	* @returns	{Object}							Returns the object passed in as the second argument, with the classes passed in as the first argument as properties.
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
	
	/** @private */
	_minion.enableNotifications = function () {
		if (_minion.isDefined("minion.NotificationManager")) {
			if (!_notificationManager) {
				_notificationManager = new (minion.get("minion.NotificationManager"))();

				/** @private */
				_minion.subscribe = function () {
					_notificationManager.subscribe.apply(_notificationManager, arguments);
				};

				/** @private */
				_minion.unsubscribe = function () {
					_notificationManager.unsubscribe.apply(_notificationManager, arguments);
				};

				/** @private */
				_minion.publish = function () {
					_notificationManager.publish.apply(_notificationManager, arguments);
				};

				/** @private */
				_minion.holdNotification = function () {
					_notificationManager.holdNotification.apply(_notificationManager, arguments);
				};

				/** @private */
				_minion.releaseNotification = function () {
					_notificationManager.releaseNotification.apply(_notificationManager, arguments);
				};

				/** @private */
				_minion.cancelNotification = function () {
					_notificationManager.cancelNotification.apply(_notificationManager, arguments);
				};
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
		* The minion Base Class
		* Classical JavaScript Inheritance (or an attempt thereof)
		* minion.Class is the ONLY Class to extend this directly, do not directly extend this Class.
		* Largely taken from: http://ejohn.org/blog/simple-javascript-inheritance/
		* @ignore */

		__BaseClass__ : (function() {

			/*
				Attempts to shallow copy objects, so as to not have a bunch of references lying around in object instances
				Otherwise, it is bad news bears doing something like this.nArray.push() in a Class method
				because it modifies nArray on prototype, and thus any other instances of said Class
			*/
			var _copy = function (obj) {
				var i, attr, c;

				// Null, undefined, number, boolean, string, function all get returned immediately, no need to copy them.
				if (!obj || typeof obj !== "object") {
					return obj;
				}

				if (obj instanceof Date) {
					return new Date().setTime(obj.getTime());
				}

				if (obj instanceof Array) {
					return obj.concat();
				}

				if (typeof obj === "object") {
					c = {};
					for (attr in obj) {
						if (obj.hasOwnProperty(attr)) {
							c[attr] = obj[attr];
						}
					}
					return c;
				}
				// If it fails, just return the original object.
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

			/** @ignore */
			var _baseClass = function(){};

			_baseClass.__isDefined = true;

			/** @ignore */
			_baseClass.__extend = function(obj) {

				// By passing "__no_init__" as the first argument, we skip calling the constructor and other initialization;
				var This = this;
				var _proto = new This("__no_init__");
				var _perInstanceProps = {};
				var _this = this;

				// Copy the object's properties onto the prototype
				for(var name in obj) {

					if(obj.hasOwnProperty(name)) {

						if(name !== "__static"){
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

							This method is preferred over this.use_dependencies(), as you have to explicitly call this.unuse_dependencies()
							to be responsible, at the end of every method.
						*/
						if(!_class.prototype.hasOwnProperty("__imports")){
							_class.prototype.__imports = minion.use(this.__dependencies, {});
						}

						if(!this.__preInit){

							for (var attr in _perInstanceProps) {
								if (_perInstanceProps.hasOwnProperty(attr)) {
									this[attr] = _copy(_perInstanceProps[attr]);
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

})();(function(){
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Class# */ 

		Class : minion.extend("minion.__BaseClass__", {

			__static : {
				__isDefined: true
			},
			
			/**
			*
			* The base minion Class. All Classes are required to be descendants
			* of this class, either directly, or indirectly.
			*
			* @constructs
			*/
			init: function(){
				if(!this._interestHandlers){
					this._interestHandlers = [];
				}
			},
			
			/** 
			* Local version of window.setTimeout that keeps scope of <i>this</i>.<br>
			* 
			* @returns	{Number}		A timeout ID
			*/
			setTimeout : function(func, delay){
				return setTimeout(this.proxy(func), delay);
			},

			/** 
			* Local version of window.setInterval that keeps scope of <i>this</i>.<br>
			*
			* @returns	{Number}		An interval ID
			*/
			setInterval : function(func, delay){
				return setInterval(this.proxy(func), delay);
			},

			/** 
			* Shorthand for <i>func.bind(this)</i><br>
			* or rather, <i>$.proxy(func, this)</i> in jQuery terms
			*
			* @returns	{Function}	The proxied function
			*/
			proxy : function(func){
				var bind = function (context) {
					if (!context) {return this;}
					var this_ = this;
					return function() {
						return this_.apply(context, Array.prototype.slice.call(arguments));
					};
				};

				return bind.call(func, this);
			},
			
			/** 
			* Subscribes to a notification.
			*
			* @public
			* @param		{String}				name			The name of the Notification you are subscribing to.
			* @param		{Function}			handler		A function to be called upon receiving the given Notification.
			*/

			subscribe : function(name, handler, priority){
				if(!this._interestHandlers){
					this._interestHandlers = [];
				}
				if(handler && !this._interestHandlers[name]){
					minion.subscribe(this, name, priority);
					this._interestHandlers[name] = handler;
				}
			},

			/** 
			* Unsubscribes from a notification.
			*
			* @public
			* @param		{String}				name			The name of the Notification you are unsubscribing from.
			*/

			unsubscribe : function(name){
				if(this._interestHandlers && this._interestHandlers[name]){
					this._interestHandlers[name] = null;
					delete this._interestHandlers[name];
				}
				minion.unsubscribe(this, name);
			},

			/**
			* Unsubscribes from all notifications registered via this.subscribe();
			*/

			unsubscribeAll : function(){
				for(var interest in this._interestHandlers){
					if(this._interestHandlers.hasOwnProperty(interest)){
						this.unsubscribe(interest);
					}
				}
				this._interestHandlers = [];
			},

			/** 
			* Publishes a notification with the specified data.
			*
			* @param		{String}				name			The name of the Notification you are publishing.
			* @param		{Object}				data			An object of data you want to send with the Notification.
			* @param		{Function}				callback		A callback function to be invoked if Notification.respond() is called
			*/

			publish : function(name, data, callback){
				minion.publish(name, data, this, callback);
			},
			
			/** @ignore */
			handleNotification : function(n){
				var handler = this._interestHandlers[n.name];
				if(handler){
					this.proxy(handler)(n);
				}
			}

		})
	});

})();	(function(){
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Singleton# */ 

		Singleton : minion.extend("minion.Class", {

			/**
			*
			* A way to easily implement Singletons.
			*
			* @constructs
			* @extends minion.Class
			*/
			init : function(){

			},
			
			/** @ignore */
			__preInit : function(){
				if(this.constructor.__instance){
					return this.constructor.__instance;
				}
				
				this.init.apply(this, arguments);

				this.constructor.__instance = this;
				return this.constructor.__instance;
			},

			/** @ignore */
			__static : {

				/** @lends minion.Singleton# */ 
				__isSingleton: true,

				/**
				*
				* Returns the instance of this Singleton. If this Class has not yet been instantiated, creates a new instance and returns that.
				* Otherwise, it returns the already existing reference.
				*
				* @memberOf minion.Singleton#
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

		/** @lends minion.Static# */ 

		Static : minion.extend("minion.Singleton", {

			__static : {
				__isDefined : true,
				__isStatic : true
				
			},

			/**
			*
			* A way to easily implement Static Classes.
			*
			* @constructs
			* @extends minion.Singleton
			*/
			init : function(){

			}

		})
	});
	
})();(function(){
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Notification# */ 

		Notification : minion.extend("minion.Class", {

			data : {},
			name : "",
			dispatcher : null,
			status : 0, // 0 : Closed; 1 : Pending; 2 : Hold
			pointer : 0,
			callback : null,

			/**
			*
			* Notifications are the backbone of Minion's pub/sub model.
			* You should not have to construct Notification's directly, as the publish() method does this for you.
			*
			* @constructs
			* @param		{String}				name			The name of the Notification.
			* @param		{Object}				data			An object of data associated with the Notification.		
			* @param		{Function}				callback		A callback function. This gets invoked by calling Notification.respond();
			*/
			init : function(name, data, callback) {
				this.name = name;
				this.data = data;
				this.callback = callback;
			},

			/**
			*
			* Holds a notification. Useful if you want to do other things before other instances receive this Notification,
			*
			* @public
			*/
			hold : function() {
				this.status = 2;
			},

			/**
			*
			* Releases a Notification, call this at some point after hold();
			*
			* @public
			*/

			release : function() {
				this.status = 1;
				minion.releaseNotification(this);
			},

			/**
			*
			* Cancels a Notification, any instances interested in this Notification higher up the chain will not receive it.
			*
			* @public
			*/

			cancel : function() {
				minion.cancelNotification(this);

				this.data = {};
				this.name = "";
				this.status = 0;
				this.pointer = 0;
				this.dispatcher = null;
				this.callback = null;
			},

			/**
			*
			* Dispatches a Notification. You will rarely ever construct or call dispatch() on Notifications directly, as the publish() method handles all of this.
			*
			* @param		{Object}		obj		An Object referencing what is dispatching this Notification.
			* @public
			*/

			dispatch : function(obj) {
				this.status = 1;
				this.pointer = 0;
				this.dispatcher = obj;

				minion.publish(this);
			},

			/**
			*
			* Responds to a Notification. Pretty much just calls the callback function that is passed when constructing a new function.
			*
			* @public
			*/

			respond : function () {
				if(this.callback) {
					this.callback.apply(typeof this.dispatcher == "object" ? this.dispatcher : this, arguments);
					this.callback = null;
					this.cancel();
				}
			}
		})
	});


	minion.define("minion", {

		/*
			This Class handles all the nitty gritty Notification stuff.
			TODO: Be nice and add some comments for other people :)
		*/

		require : [
			"minion.Notification"
		],

		NotificationManager : minion.extend("minion.Singleton", {

			_pendingNotifications: [],
			_pendingNotificationNames : [],
			_interests: {},
			_removeQueue: [],
			
			subscribe : function(obj, name, priority) {
				
				priority = isNaN(priority) ? -1 : priority;
				this._interests[name] = this._interests[name] || [];

				if(priority <= -1 || priority >= this._interests[name].length){
					this._interests[name].push(obj);
				}
				else{
					this._interests[name].splice(priority, 0, obj);
				}
			},

			unsubscribe : function(obj, name){
				if(name instanceof Array){
					for(var i = 0; i < name.length; i ++){
						this.unsubscribe(obj, name[i]);
					}
					return;
				}
				var objIndex = this._interests[name].indexOf(obj);
				if(obj && objIndex > -1){

					if(this._pendingNotificationNames.indexOf(name) > -1) {
						var rq = this._removeQueue[name] = this._removeQueue[name] || [];
						rq.push(obj);
					}
					else{
						this._interests[name].splice(objIndex, 1);
					}
				}
			},
			
			publish : function(notification, data, obj, callback){

				if(!(notification instanceof this.__imports.Notification)){
					notification = new this.__imports.Notification(notification, data, callback);
					notification.status = 1;
					notification.pointer = 0;
					notification.dispatcher = obj;
				}
				
				var name = notification.name;

				if(this._interests[name]){
					this._pendingNotifications.push(notification);
					this._pendingNotificationNames.push(name);
					this._notifyObjects(notification);
				}
			},
			
			_notifyObjects : function(notification){

				var name = notification.name;

				while(notification.pointer < this._interests[name].length) {
					if(notification.status === 1){
						if(this._interests[name][notification.pointer].handleNotification){
							this._interests[name][notification.pointer].handleNotification(notification);
						}
						notification.pointer ++;
					}
					else{
						return;
					}
				}

				if(notification.status === 1 && !notification.callback) {
					this.cancelNotification(notification);
				}
			},

			getNotification : function(name) {
				for(var i = 0; i < this._pendingNotifications.length; i ++){
					if(this._pendingNotifications[i].name === name){
						return this._pendingNotifications[i];
					}
				}
			},
						
			releaseNotification : function(notification){
				notification.status = 1;
				if(this._pendingNotifications.indexOf(notification) > -1){
					this._notifyObjects(notification);
				}
			},
			
			cancelNotification : function(notification){
				if(notification){

					var name = notification.name;
					
					this._pendingNotifications.splice(this._pendingNotifications.indexOf(notification), 1);

					notification.status = 0;

					if(this._removeQueue[name]){
						for(var i = 0; i < this._removeQueue.length; i ++){
							this.unsubscribe(this._removeQueue[name][i], name);
						}
						this._removeQueue[name] = null;
						delete this._removeQueue[name];
					}

					notification = null;
				}
			}

		})

	});

	minion.enableNotifications();

})();
