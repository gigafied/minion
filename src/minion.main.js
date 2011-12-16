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
*	Global minion Class with static methods.
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

	var _separator = ".";
	var _class_path = "";
	var _file_suffix = "";

	var _initialized;

	var _loadedFiles = [];
	var _loadQueue = [];
	var _extendQueue = [];

	var _waitID;
	var _waitingForLoad = [];
	var _requestedFiles = [];
	var _notificationManager;
	var _waitInterval = 500;
	var _defaultClassFile = null;

	var _isNode = (typeof window === "undefined");

	var _root = root;
	var _ns = {};
	var _pollute = false;
	var _errorTimeout = 1e4;

	/**
	* @exports _minion as minion 
	* @class
	*/
	var _minion = {};	

	/*================= HELPER FUNCTIONS =================*/

	/** @private */
	var _sTimeout = setTimeout;

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
					_sTimeout(_checkExtendQueue, 0);
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
			_waitID = _sTimeout(_checkWaitQueue, _waitInterval);
		}
	};

	/** @ignore */
	var _inject = function(f, c) {

		var doc = document;
		var body = "body";

		var injectObj, script;

		if (_requestedFiles.indexOf(f) < 0) {

			if (!doc[body]) {
				return _sTimeout(function(){
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

			_requestedFiles.push(f);	
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
		}
	};

	/**
	* Does all the loading of JS files
	*
	* @param		q		The queue to be loaded
	* @ignore
	* @private 
	*/

	var _load = function (q) {

		_loadQueue.push(q);

		for (var i = 0; i < q.f.length; i += 1) {
			if(_isNode){
				var c = require(q.f[i]);
			}
			else{
				_inject(q.f[i], q.c[i]);
			}
			_loadedFiles.push(q.f[i]);
		}

		/*
			If the load times out, fire onerror after the time defined by _errorTimeout (default is 10 seconds)
			(can be changed through minion.config({minion.errorTimeout : ms});
		*/
		_waitID = _sTimeout(_checkWaitQueue, _waitInterval);
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

			if (parts[0] === "minion") {
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

			if(_pollute){
				_copyToNS(_ns, _root);
			}
		}

		return ns;
	};

	/*================= END OF HELPER FUNCTIONS =================*/


	/**
	* Configure minion.
	* 
	* @public
	* @param		 {Object}		configObj			Configuration object, possible properties are : classPath, separator and fileSuffix
	*/

	_minion.configure = function (configObj) {
		
		configObj = configObj || {};

		_class_path = configObj.classPath || _class_path;
		_class_path = (_class_path.lastIndexOf("/") === _class_path.length - 1) ? _class_path : _class_path + "/";

		_separator = configObj.separator || _separator;
		_file_suffix = configObj.fileSuffix || _file_suffix;

		var pollute = false;

		if(configObj.pollute === true){
			pollute = configObj.pollute;
		}

		if(configObj.rootNS) {
			_root = configObj.rootNS;
		}

		var i;

		if (_initialized && pollute === true) {
			_copyToNS(_ns, _root);
			_pollute = true;
		}
		else{
			_removeFromNS(_ns, _root);
		}

		_initialized = true;
	};

	/**
	* Gets the object by it's fully qualified identifier.
	*
	* @public
	* @param			{String}			id						The identifier to get
	* @returns		{Object|Boolean}						The object that represents the identifier or False if it has not yet been defined.
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
	* @param			{Object}			[definitions]			An object of class definitions which will be added to the namespace
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

		if(_defaultClassFile){
			return _defaultClassFile;
		}
	
		if (_classMappings[id]) {
			return _classMappings[id];
		}
		
		var url = _class_path + id.replace(new RegExp('\\' + _separator, 'g'), '/') + '.js' + ((_file_suffix) ? "?" + _file_suffix : "");

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
	* minion.provides can load the file right away, by passing doLoad as true, and a callback function.
	* Otherwise, it just maps the classes to the specified filePath for any subsequent calls to minion.require()
	*
	* @public
	* @param		{String}				file					The path of a JS file.
	* @param		{String|Array}		definitions			Fully qualfiied name(s) of class(es)
	* @param		{Boolean}			[doLoad=false]		Whether or not to subsequently call minion.require()
	* @param		{Function}			[callback=null]	If doLoad=true, the callback function to call once the file has been loaded.
	*/

	_minion.provides = function (file, definitions, doLoad, callback) {

		if(definitions === "*"){
			_defaultClassFile = file;
			return;
		}

		// If classes is a String, create an array
		definitions = _strToArray(definitions);

		// If the file is not absolute, prepend the _class_path
		file = (!new RegExp("(http://|/)[^ :]+").test(file)) ? _class_path + file : file;

		for (var i = 0; i < definitions.length; i += 1) {
			_classMappings[definitions[i]] = file;
		}

		if (doLoad) {
			_minion.require(definitions, callback);
		}
	};

	/**
	* Asyncrhonously loads in js files for the classes specified.
	* If the classes have already been loaded, or are already defined, the callback function is invoked immediately.
	*
	* @public
	* @param	 {String|Array}	ids				The fully qualified names of the class(es) to load.
	* @param	 {Function}			callback			The function to call once all classes (and their dependencies) have been loaded.
	*/

	_minion.require = function (ids, callback) {
		if (!_initialized) {
			_minion.configure();
		}

		ids = _strToArray(ids);
	
		var fileList = [];
		var classList = [];

		for (var i = 0; i < ids.length; i += 1) {

			var id = ids[i];
			var file = _minion.getURL(id);

			if ((_requestedFiles.indexOf(file) < 0) && !_minion.get(id)) {
				fileList.push(file);
				classList.push(id);
			}
		}

		if (fileList.length > 0) {

			var q = {
				f	: fileList,
				c	: classList,
				cb : callback
			};
									
			//_load(q);
			_sTimeout(function(){_load(q);}, 0);
		}

		else if (callback) {
			callback();
		}
	};

	/**
	* Copies an array of classes (by their fully qualified names) to the specified object/scope.
	*
	* By calling minion.use("com.test.Example", obj), you will be able to refer to com.test.Example as just obj.Example.
	* 
	* Identifiers can contain the* wildcard character as its last segment (eg: com.test.*) 
	* which will import all Classes under the given namespace.
	*
	* @public
	* @param		{String|Array}		ids		The fully qualfiied name(s) to import into the global namespace.
	* @param		{Object=[root]}				The scope to use.
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
	_minion.getLoadedFiles = function () {
		return _loadedFiles.concat();
	};
		
	/** @private */
	_minion.enableNotifications = function () {
		if (_minion.isDefined("minion.NotificationManager")) {
			if (!_notificationManager) {
				_notificationManager = new minion.NotificationManager();
			}
		}
	};

	/** @private */
	_minion.addInterest = function () {
		if (_notificationManager) {
			_notificationManager.addInterest.apply(_notificationManager, arguments);
		}
	};

	/** @private */
	_minion.addInterests = function () {
		if (_notificationManager) {
			_notificationManager.addInterests.apply(_notificationManager, arguments);
		}
	};

	/** @private */
	_minion.removeInterest = function () {
		if (_notificationManager) {
			_notificationManager.removeInterest.apply(_notificationManager, arguments);
		}
	};
	
	/** @private */
	_minion.removeInterests = function () {
		if (_notificationManager) {
			_notificationManager.removeInterests.apply(_notificationManager, arguments);
		}
	};

	/** @private */
	_minion.removeAllInterests = function () {
		if (_notificationManager) {
			_notificationManager.removeAllInterests.apply(_notificationManager, arguments);
		}
	};

	/** @private */
	_minion.notify = function () {
		if (_notificationManager) {
			_notificationManager.notify.apply(_notificationManager, arguments);
		}
	};

	/** @private */
	_minion.holdNotification = function () {
		if (_notificationManager) {
			_notificationManager.holdNotification.apply(_notificationManager, arguments);
		}
	};

	/** @private */
	_minion.releaseNotification = function () {
		if (_notificationManager) {
			_notificationManager.releaseNotification.apply(_notificationManager, arguments);
		}
	};

	/** @private */
	_minion.cancelNotification = function () {
		if (_notificationManager) {
			_notificationManager.cancelNotification.apply(_notificationManager, arguments);
		}
	};

	_minion.publish = _minion.notify = function (name, data) {
		if (_notificationManager) {
			var notification = new minion.Notification(name, data);
			notification.dispatch(_minion);
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

})(this);