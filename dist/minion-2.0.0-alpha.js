/*
 * minion.JS v2.0.0-alpha
 * http://minion.org
 *
 * (c) 2012, Taka Kojima (taka@gigafied.com)
 * Licensed under the MIT License
 *
 * Date: Sun Feb 12 20:18:22 2012 -0800
 */
 /*
	TODO:
		- Multiple inheritance
		- Independent library support, i.e. ability to do minion.require("minion.libs.jquery") to load jquery
		- AMD Compliant?
		- minion.provides("namespace.*");
		- setup() method on Classes, takes 1 argument, a callback that gets called once setup() does all it needs to do
*/

var minion = (function (root) {

	"use strict";

	/*================= Array.indexOf(), and Function.bind() polyfills =================*/

		if (!Array.prototype.indexOf) {
			Array.prototype.indexOf = function (a, b) {
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
					b ++;
				}
				return -1;
			};
		}

		if (!Function.prototype.bind) {
			Function.prototype.bind = function (oThis) {
				if (typeof this !== "function") {
					// closest thing possible to the ECMAScript 5 internal IsCallable function
					throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
				}

				var aArgs = Array.prototype.slice.call(arguments, 1), 
				fToBind = this, 
				fNOP = function () {},
				fBound = function () {
					return fToBind.apply(this instanceof fNOP ? this : oThis || window,
					aArgs.concat(Array.prototype.slice.call(arguments)));
				};

				fNOP.prototype = this.prototype;
				fBound.prototype = new fNOP();
				return fBound;
			};
		}

	/*================= END OF Array.indexOf(), and Function.bind() polyfills =================*/
	
	/*================= internal/private variables =================*/

		var _classMappings = [];
		var _aliases = ["minion"];

		var _class_path = "";
		var _file_suffix = "";

		var _initialized;

		var _loadQ = [];
		var _extendQ = [];

		var _waitID;
		var _waitingForLoad = [];
		var _loadedFiles = [];
		var _NotificationManager;
		var _waitInterval = 500;

		var _isNode = (typeof window === "undefined");

		var _root = root;
		var _ns = {};
		var _errorTimeout = 1e4;

	/*================= END OF internal/private variables =================*/


	/*================= HELPER FUNCTIONS =================*/


		var _isArray = Array._isArray || function (a) {
			return a instanceof Array;
		};

		var _isObject = function (obj) {
			return typeof obj === "object";
		};

		var _isFunction = function (fn) {
			return typeof fn === "function";
		};

		var _strToArray = function (s) {
			return (!_isArray(s)) ? [s] : s;
		};


		var _checkLoadQ = function () {
			var i, j, q, classes, classesArray;
			q = {};
			classes = {};
			classesArray = [];

			for (i = _loadQ.length - 1; i >= 0; i --) {

				q = _loadQ[i];

				if (q.cb) {
					q.cb.apply(_root, _minion.get(q.c));
				}
				_loadQ.splice(i, 1);
			}
		};


		var _checkExtendQ = function () {
			var eq = _extendQ;
			var i, superClass, ns, id;

			for (i = eq.length - 1; i >= 0; i --) {

				ns = eq[i].split(minion.separator);
				id = ns.splice(ns.length - 1, 1)[0];
				ns = _minion.get(ns.join(minion.separator), false);

				if (ns[id].$$.toExtend) {
					superClass = _minion.get(ns[id].$$.extendedFrom, false);
					if (superClass.$$.isDefined) {

						ns[id].$$.toExtend = false;
						delete ns[id].$$.toExtend;

						ns[id] = _minion.extend(ns[id].$$.extendedFrom, ns[id]);

						eq.splice(i, 1);
						setTimeout(_checkExtendQ, 0);
						return;
					}
				}
			}
			_checkLoadQ();
		};


		var _checkWaitQ = function () {

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
				_waitID = setTimeout(_checkWaitQ, _waitInterval);
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

			_loadQ.push(q);

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
			_waitID = setTimeout(_checkWaitQ, _waitInterval);
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
				var parts = id.split(minion.separator);

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
			
				for (var className in definitions) {

					var qualifiedName = id + minion.separator + className;
					var c = definitions[className];

					if (c.$$.toExtend) {				
						if (_extendQ.indexOf(qualifiedName) < 0) {
							_extendQ.push(qualifiedName);
						}
					}

					ns[className] = c;
				}
			}

			return ns;
		};

	/*================= END OF HELPER FUNCTIONS =================*/

	var _minion = {};	

	_minion.separator = ".";

	/**
	* Configure minion.
	*/

	_minion.configure = function (configObj) {
		
		configObj = configObj || {};

		_class_path = configObj.classPath || _class_path;
		_class_path = (_class_path.lastIndexOf("/") === _class_path.length - 1) ? _class_path : _class_path + "/";

		minion.separator = configObj.separator || minion.separator;
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
	* Defines Classes under the given namespace.
	*/
	_minion.define = function (id, definitions) {
		var r = _namespace(id, true, definitions);
		_checkExtendQ();
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
		var url = _class_path + id.replace(new RegExp('\\' + minion.separator, 'g'), '/') + (isDir ? "" : '.js') + ((_file_suffix) ? "?" + _file_suffix : "");

		return url;
	};

	/**
	* Checks to see whether the given fully qualified name or Object is defined as a minion class. (Checks for $$.isDefined)
	*/

	_minion.isDefined = function (id) {
		id = (!_isObject(id) && !_isFunction(id)) ? _namespace(id, false) : id;
		return (id) ? id.$$.isDefined : false;
	};

	/**
	* Extends a given class asynchronously.
	*/ 

	_minion.extend = function (id, obj) {
		
		obj.$$ = obj.$$ || {};
	
		// If the Class exists and is a minion class, then return the extended object.
		if (_minion.isDefined(id)) {
			obj = _minion.get(id).extend(obj);
		}
		else{
			obj.$$.toExtend = true;
		}

		obj.$$.extendedFrom = id;

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
									
			_load(q);
			//setTimeout(function(){_load(q);}, 0);
		}

		else if (callback) {
			callback.apply(_root, _minion.get(ids));
		}
	};

	// Like $.proxy(), or Function.bind, just a way to make sure it is there cross-browser.
	_minion.proxy = function (fn, scope) {
		return fn.bind(scope);
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

})(this);(function () {

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

})();(function () {
	
	"use strict";

	minion.define("minion", {

		Class : minion.extend("minion.__BaseClass__", {

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

				this._interestHandlers = this._interestHandlers || [];

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
			
			preInit : function(){
				if(this.constructor.__instance){
					return this.constructor.__instance;
				}
				
				this.init.apply(this, arguments);

				this.constructor.__instance = this;
				return this.constructor.__instance;
			},

			static : {

				/**
				* Returns the instance of this Singleton. If this Class has not yet been instantiated,
				* creates a new instance and returns that. Otherwise, it returns the already existing reference.
				*/

				getInstance : function(){
					if(!this.__instance){
						var This = this;
						return this.__instance =  new This();
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
