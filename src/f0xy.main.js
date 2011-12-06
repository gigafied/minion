/**

@fileOverview

<h4>f0xy - AMD inspired Classy JavaScript</h4>

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
*	Global f0xy Class with static methods.
*
*	@namespace
*/

/*
	TODO:
		- Notification Support Toggling? 
		- Multiple inheritance
		- Independent library support, i.e. ability to do f0xy.require("f0xy.libs.jquery") to load jquery
		- AMD adherence?
		- NodeJS implementation (almost there)
*/

var f0xy = (function (root) {

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
	var _classes = {};

	var _origRootNS = {};
	var _initialized;

	var _loadQueue = [];
	var _extendQueue = [];

	var _waitID;
	var _waitingForLoad = [];
	var _requestedFiles = [];
	var _notificationManager;
	var _waitInterval = 500;


	/*
	If this is an iFrame or a new window, check for a parent, and if said parent has a f0xy root object, 
	copy the reference locally, along with all defined Classes and whatnot.

	Makes for some awesome goodness, being able to easily communicate between windows and iframes through notifications
	and not having to load classes more than once.
	*/

	var nsTarget;
	nsTarget = (root.parent && root.parent.f0xy) ? root.parent.f0xy : nsTarget;
	nsTarget = (root.opener && root.opener.f0xy) ? root.opener.f0xy : nsTarget;
	
	if (nsTarget) {
		try{
			nsTarget.copyToNS(root);
			return nsTarget;
		}
		catch(e){;}
	}
	//


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
	var _sTimeout = setTimeout;

	// Recursively checks dependencies
	/** @private */
	var _areDependenciesLoaded = function (o) {
		o = _f0xy.get(o, false);
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
		var i, j, q, dependenciesLoaded;
		q = {};

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
					q.cb();
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
			ns = _f0xy.get(ns.join(_separator), false);

			if (ns[id].__toExtend) {
				superClass = _f0xy.get(ns[id].__extendedFrom, false);
				if (superClass.__isDefined) {

					ns[id].__toExtend = false;
					delete ns[id].__toExtend;

					ns[id] = _f0xy.extend(ns[id].__extendedFrom, ns[id]);

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
			
			if (_f0xy.isDefined(o.c)) {
				//o.s.onload();
			}
			
			else if (o.e >= _f0xy.errorTimeout) {
				o.s.onerror();
			}
		}

		if (w.length > 0) {
			_waitID = _sTimeout(_checkWaitQueue, _waitInterval);
		}
	};

	/**
	* Does all the loading of JS files
	*
	* @param		q 		The queue to be loaded
	* @ignore
	* @private 
	*/

	var _load = function (q) {

		var doc = document;
		var head = "head";
		_loadQueue.push(q);

		/** @ignore */
		function inject(f, c) {

			var injectObj, script;

			if (_requestedFiles.indexOf(f) < 0) {

				if (!doc[head]) {
					return _sTimeout(inject, 0, f, c);
				}

				script = doc.createElement("script");
			 	script.async = true;
			
				injectObj = {
					f : f, 		// File
					c : c, 		// Class
					e : 0, 		// Elapsed Time
					s : script // Script
				};

				_requestedFiles.push(f);	
				_waitingForLoad.push(injectObj);

				/** @ignore */
				script.onreadystatechange = /** @ignore */ script.onload = function (e) {
					if (_f0xy.isDefined(c)) {
						injectObj.s.onload = injectObj.s.onreadystatechange = null;
						injectObj.s.onerror = null;
						_waitingForLoad.splice(_waitingForLoad.indexOf(injectObj), 1);
				 	}
				};

				/** @ignore */
				script.onerror = function (e) {
					throw new Error(injectObj.c + " failed to load. Attempted to load from file: " + injectObj.f);
					injectObj.s.onerror = null;
					_waitingForLoad.splice(_waitingForLoad.indexOf(injectObj), 1);
				}

				script.src = f;
				
				// Append the script to the document head
			 	doc[head].appendChild(script);
			}
		}

		for (var i = 0; i < q.f.length; i += 1) {
			inject(q.f[i], q.c[i]);
		}

		/*
			If the load times out, fire onerror after the time defined by f0xy.errorTimeout (default is 10 seconds)
			(can be changed through setting f0xy.errorTimeout = ms)
		*/
		_waitID = _sTimeout(_checkWaitQueue, _waitInterval);
	}

	/**
	* Used by f0xy.get() and f0xy.define(). 
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

		var ns = _f0xy.ns;
		var ns2 = _classes;
		var i;

		if (id && !_isObject(id) && !_isFunction(id)) {
			var parts = id.split(_separator);

			if (parts[0] === "f0xy") {
				ns = _f0xy;
				ns2 = ns2.f0xy || {};
				ns2.f0xy = ns2;
				parts.splice(0,1);
			}

			for (i = 0; i < parts.length; i += 1) {
				if (!ns[parts[i]]) {
					if (autoCreate) {
						ns[parts[i]] = {};
						ns2[parts[i]] = {};
					}
					else{
						return false;
					}
				}
				ns = ns[parts[i]];
			}
		}

		else if (id != "") {
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
				
					c.__nsID = id;
					c.__ns = ns;
					c.__class = className;

					if (cr.length > 0) {
						c.__dependencies = _concatArray(c.__dependencies, cr, true);
						_f0xy.require(cr);
					}

					if (_f0xy.isDefined(c) && c.prototype) {
						var proto = c.prototype;
						proto.__nsID = id;
						proto.__ns = ns;
						proto.__class = className;

						if (cr.length > 0) {
							proto.__dependencies = _concatArray(proto.__dependencies, cr, true);
						}
					}

					ns[className] = c;
					ns2[className] = c;
				}
			}
		}

		return ns;
	}

	/*================= END OF HELPER FUNCTIONS =================*/


	/**
	* @exports _f0xy as f0xy 
	* @class
	*/
	var _f0xy = {};

	// Set the root namespace
	_f0xy.ns = {};

	// Set the default error timeout to 10 seconds.
	_f0xy.errorTimeout = 1e4;

	/**
	* Configure f0xy. Call to update the base class path, or to change the default _separator (".").
	* 
	* @public
	* @param		 {String}		[new_separator="."]		Namespace _separator
	* @param		 {String}		[new_class_path="js/"]	The root path of all your classes. Can be absolute or relative.
	*/

	_f0xy.configure = function (new_class_path, new_separator, useRootNS) {
		_class_path = new_class_path || _class_path;
		_separator = new_separator || _separator;
		_class_path = (_class_path.lastIndexOf("/") === _class_path.length - 1) ? _class_path : _class_path + "/";
		var i;

		if (!_initialized) {
			if (useRootNS !== false) {
				for (i in _f0xy.ns) {
					if (!root[i]) {
						root[i] = _f0xy.ns[i];
					}
				}
				_f0xy.ns = root;
			}
			_initialized = true;
		}
	}

	/**
	* Gets the object by it's fully qualified identifier.
	*
	* @public
	* @param			{String}			id						The identifier to get
	* @returns		{Object|Boolean}						The object that represents the identifier or False if it has not yet been defined.
	*/

	_f0xy.get = function (id) {
		return _namespace(id, false);
	}

	/**
	* Defines Classes under the given namespace.
	*
	* @public
	* @param			{String}			id						The namespace to define the Classes under.
	* @param			{Object}			[definitions]			An object of class definitions which will be added to the namespace
	* @returns		{Object}									The object that represents the namespace passed in as the first argument.
	*/
	_f0xy.define = function (id, definitions) {
		var r = _namespace(id, true, definitions);
		_checkExtendQueue();
		return r;
	}

	/**
	* Gets the URL for a given identifier.
	*
	* @public
	* @param		 	{String}		id						The fully qualified name to look up.
	* @returns		{String}								The URL of the file that maps to the fully qualified name.
	*/

	_f0xy.getURL = function (id) {
	
		if (_classMappings[id]) {
			return _classMappings[id];
		}

		return (_class_path + id).replace(new RegExp('\\' + _separator, 'g'), '/') + '.js';
	}

	/**
	* Checks to see whether the given fully qualified name or Object is defined as a f0xy class. (Checks for .__isDefined)<br>
	* NOTE: Classes that have not yet loaded all of their dependencies, will return FALSE for this check.
	*
	* @public
	* @param			{String|Object}	id						The fully qualfied class name, or an Object.
	* @returns		{Boolean}									Whether or not this is defined.
	*/

	_f0xy.isDefined = function (id) {
		id = (!_isObject(id) && !_isFunction(id)) ? _namespace(id, false) : id;
		return (id) ? id.__isDefined : false;
	}	

	/**
	* Extends a given class asynchronously.
	*
	* @public
	* @param			{String}		id						The fully qualified name of the Class you want to extend.
	* @param			{Object}		obj					A new Class Object
	* @returns		{Object}								The extended Class, or, if still waiting on dependencies, the original Object with a few more properties for internal f0xy use.
	*/ 

	_f0xy.extend = function (id, obj) {
	
		// If the Class exists and is a f0xy class, then return the extended object.
		if (_f0xy.isDefined(id)) {
			obj = _f0xy.get(id).__extend(obj);
		}
		else{
			obj.__toExtend = true;
		}

		obj.__extendedFrom = id;

		return obj;
	}

	/**
	* Imports properties from the specified namespace to the global space (ie. under f0xy.ns, or _root)
	* This is only meant to be used as a utility, and for temporary purposes. Please clean up with f0xy.unuse()
	* You are responsible for not polluting the global namespace.
	*
	* By calling f0xy.use("com.test.Example"), you will be able to refer to com.test.Example as just Example.
	* By calling f0xy.use("com.test"), you will be able to refer to com.test.Example as just test.Example.
	* 
	* Identifiers can contain the* wildcard character as its last segment (eg: com.test.*) 
	* which will import all Classes under the given namespace.
	*
	* @see 		f0xy.unuse
	* @public
	* @param	 	{String|Array}	ids		The fully qualfiied name(s) to import into the global namespace.
	* @param		{Object=[root]}			The scope to use.
	*/
	 
	_f0xy.use = function (ids, scope) {

		ids = ids || [];
		ids = _strToArray(ids);
		scope = scope || _f0xy.ns;

		if (scope === _f0xy.ns) {
			_f0xy.unuse();
		}

		var i, id, obj, ns, n;

		for (i = 0; i < ids.length; i += 1) {
		
			id = ids[i];

			obj = _f0xy.get(id, true);
			ns = id.split(_separator);
			id = ns.splice(ns.length - 1, 1)[0];
			ns = _f0xy.get(ns.join(_separator), false);
		
			if (id === '*') {
				// injects all ids under namespace into the root namespace
				for (var n in ns) {
					if (scope === _f0xy.ns) {
						_origRootNS[n] = (scope[n]) ? scope[n] : null;
					}
					scope[n] = ns[n];
				}
			}
			else{
				// injects this id into the root namespace
				if (ns[id]) {
					if (scope === _f0xy.ns) {
						_origRootNS[id] = (scope[id]) ? scope[id] : null;
					}
					scope[id] = ns[id];
				}
			}
		}

		return scope;
	}

	/**
	* Clears all temporary global namespacing mappings created by f0xy.use(). This method has no arguments, it clears all
	* temporary namespaces.
	* 
	* @see f0xy.use
	*
	* @public
	*/

	_f0xy.unuse = function () {
		for (var prop in _origRootNS) {
			_f0xy.ns[prop] = _origRootNS[prop];
			if (_f0xy.ns[prop] === null) {
				delete _f0xy.ns[prop];
			}
		}
		_origRootNS = {};
	}


	/**
	* Copies f0xy and all classes over to the specified Namespace (by reference)
	* Awesome sauce!

	* @public
	* @param	 	{Object}	ns		An object representing the namespace
	*/

	_f0xy.copyToNS = function (ns) {
		ns.f0xy = f0xy;

		for (var n in _classes) {
			ns[n] = _f0xy.ns[n];
		}
	}

	/**
	* Tells f0xy that filePath provides the class definitions for these classes.
	* Useful in cases where you group specific things into minfiied js files.
	*
	* f0xy.provides can load the file right away, by passing doLoad as true, and a callback function.
	* Otherwise, it just maps the classes to the specified filePath for any subsequent calls to f0xy.require()
	*
	* @public
	* @param		{String}				file					The path of a JS file.
	* @param	 	{String|Array}		definitions			Fully qualfiied name(s) of class(es)
	* @param		{Boolean}			[doLoad=false]		Whether or not to subsequently call f0xy.require()
	* @param 	{Function}			[callback=null]	If doLoad=true, the callback function to call once the file has been loaded.
	*/

	_f0xy.provides = function (file, definitions, doLoad, callback) {

		// If classes is a String, create an array
		definitions = _strToArray(definitions);

		// If the file is not absolute, prepend the _class_path
		file = (!new RegExp("(http://|/)[^ :]+").test(file)) ? _class_path + file : file;

		for (var i = 0; i < definitions.length; i += 1) {
			_classMappings[definitions[i]] = file;
		}

		if (doLoad) {
			_f0xy.require(definitions, callback);
		}
	}

	/**
	* Asyncrhonously loads in js files for the classes specified.
	* If the classes have already been loaded, or are already defined, the callback function is invoked immediately.
	*
	* @public
	* @param	 {String|Array}	ids				The fully qualified names of the class(es) to load.
	* @param	 {Function}			callback			The function to call once all classes (and their dependencies) have been loaded.
	*/

	_f0xy.require = function (ids, callback) {
		if (!_initialized) {
			_f0xy.configure();
		}

		ids = _strToArray(ids);
	
		var fileList = [];
		var classList = [];

		for (var i = 0; i < ids.length; i += 1) {

			var id = ids[i];
			var file = _f0xy.getURL(id);

			if ((_requestedFiles.indexOf(file) < 0) && !_f0xy.get(id)) {
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
	}
	
	/** @private */
	_f0xy.enableNotifications = function () {
		if (_f0xy.isDefined("f0xy.NotificationManager")) {
			if (!_notificationManager) {
				_notificationManager = new f0xy.NotificationManager();
			}
		}
	}

	/** @private */
	_f0xy.addInterest = function () {
		if (_notificationManager) {
			_notificationManager.addInterest.apply(_notificationManager, arguments);
		}
	}

	/** @private */
	_f0xy.addInterests = function () {
		if (_notificationManager) {
			_notificationManager.addInterests.apply(_notificationManager, arguments);
		}
	}

	/** @private */
	_f0xy.removeInterest = function () {
		if (_notificationManager) {
			_notificationManager.removeInterest.apply(_notificationManager, arguments);
		}
	}
	
	/** @private */
	_f0xy.removeInterests = function () {
		if (_notificationManager) {
			_notificationManager.removeInterests.apply(_notificationManager, arguments);
		}
	}

	/** @private */
	_f0xy.removeAllInterests = function () {
		if (_notificationManager) {
			_notificationManager.removeAllInterests.apply(_notificationManager, arguments);
		}
	}

	/** @private */
	_f0xy.notify = function () {
		if (_notificationManager) {
			_notificationManager.notify.apply(_notificationManager, arguments);
		}
	}

	/** @private */
	_f0xy.holdNotification = function () {
		if (_notificationManager) {
			_notificationManager.holdNotification.apply(_notificationManager, arguments);
		}
	}

	/** @private */
	_f0xy.releaseNotification = function () {
		if (_notificationManager) {
			_notificationManager.releaseNotification.apply(_notificationManager, arguments);
		}
	}

	/** @private */
	_f0xy.cancelNotification = function () {
		if (_notificationManager) {
			_notificationManager.cancelNotification.apply(_notificationManager, arguments);
		}
	}

	/*
	Define f0xy as an AMD module, if define is defined (and has .amd as a property)
	*/

	if (typeof define === "function" && define.amd) {
		define([], function () {
			return _f0xy;
		});
	}	

	return _f0xy;

})(this);