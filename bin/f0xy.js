/*
 * f0xy.JS v1.0
 * http://f0xy.org
 *
 * (c) 2011, Taka Kojima
 * Licensed under the MIT License
 *
 * Date: Mon Nov 21 15:25:02 2011 -0800
 */
 
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
	
	Inspired by NamespaceJS: https://github.com/maximebf/Namespace.js

	@ author Taka Kojima (taka@gigafied.com)
	@ version 1.0
*/


/**
		Global Static f0xy Class with static methods.
		@static
		@class
*/

/** @namespace */
var f0xy = (function(){

	"use strict";

	// If Array.indexOf is not defined, let's define it.
    Array.prototype.indexOf = Array.prototype.indexOf || function (searchElement /*, fromIndex */ ){       
        if (this === void 0 || this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n !== n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }

	// If Function.bind is not defined, let's define it.
	Function.prototype.bind = Function.prototype.bind || function(){
		var __method = this, args = Array.prototype.slice.call(arguments), object = args.shift();
		return function(){
			var local_args = args.concat(Array.prototype.slice.call(arguments));
			if (this !== window) local_args.push(this);
			return __method.apply(object, local_args);
		}
	}

	var _classMappings = [];
	var _loadedClasses = [];
	var _separator = ".";
	var _class_path = "";
	var _loadQueues = [];
	var _extendQueue = [];
	var _origWindowNS = {};

	var s = "string";
	var f = "function";
	var o = "object";
	var u = "undefined";

	/************* HELPER METHODS ***************/

	// Typechecks o against t or s
	var _typeCheck = function(o, t, s, r){
		r = (typeof o === t);
		r = (!r && s) ? (typeof o === s) : r;
		return r;
	}

	/** @private */
	var _checkExtendQueue = function(){
		
		var extendHappened = false;

		for(var i = _extendQueue.length - 1; i >= 0; i --){
			
			var packageArray = _extendQueue[i].split(_separator);
			var className	= packageArray.splice(packageArray.length-1, 1);
			var namespace = packageArray.join(_separator);
			
			var packageObj = _f0xy.get(namespace, false);
			var obj = packageObj[className];

			if(obj.toExtend){
				var superClass = _f0xy.get(obj.extendedFrom, false);
				if(superClass.isClass){
					
					var dependencies = obj.dependencies;
					var scID = obj.extendedFrom;

					obj.toExtend = false;
					delete obj.toExtend;
					
					packageObj[className] = superClass.extend(obj);

					extendHappened = true;

					_extendQueue.splice(i, 1);

				}
			}
		}
		if(extendHappened && _extendQueue.length > 0){
			_checkExtendQueue();
		}
	}

	/** @private */
	var _checkLoadQueues = function(){
		for(var i = _loadQueues.length -1; i >= 0; i --){
			var queue = _loadQueues[i];
			var dependenciesLoaded = true;
			
			for(var j = 0; j < _loadQueues[i].classes.length; j ++){
				/*	
				if(!_f0xy.isClass(_loadQueues[i].classes[j])){
					dependenciesLoaded = false;
					break;
				}
				*/

				var obj = _f0xy.get(_loadQueues[i].classes[j], false);

				if(!obj.isClass){dependenciesLoaded = false;}
				
				else if(obj.dependencies){
					for(var k = 0; k < obj.dependencies.length; k ++){
						if(_loadedClasses.indexOf(obj.dependencies[k]) === -1){
							dependenciesLoaded = false;
							break;
						}
					}
				}
				if(!dependenciesLoaded){break;}
			}

			if(dependenciesLoaded){
				_loadQueues.splice(i, 1);
				if(queue.complete){
					queue.complete.call();
				}				
			}
		}
	}

	/**
	* Does all the loading of JS files
	*
	* @param		files 		String or array of the files to be loaded.
	* @param		callback 	Callback function to call once all files have been loaded
	* @private 
	*/
	
	var _load = function(files, callback){

		var _counter = 0 ;
		var doc = document;
		var body = "body";

		// If files is a String, create an array
		if(!_typeCheck(files, o) && !files.sort){
			files = new Array(files);
		}
		
		function doLoad(){

			// If document.body does not yet exist, let's wait on the load process a bit.
			if(!doc[body]){return setTimeout(doLoad, 50);}

			for(var i = 0; i < files.length; i ++){
				
				var script = doc.createElement("script");
		      script.onload = script.onreadystatechange = function(e, i){
		          _counter ++;
		          if(_counter >= files.length){
		         	callback.call();
		          }

		      };

		      script.async = "async";
		      script.src = files[i];
		      doc[body].appendChild(script)
			}
		}

		doLoad();
	}

	/************* END HELPER METHODS ***************/	


	/**
	* @exports _f0xy as f0xy 
	* @class
	*/
	var _f0xy = {};

	/**
	* Configure f0xy. Call to update the base class path, or to change the default separator (".").
	* 
	* @public
	* @param		 {String}			[separator="."]		Namespace separator
	* @param		 {String}			[class_path="js/"]	The root path of all your classes. Can be absolute or relative.
	*/

	_f0xy.configure = function(class_path, separator){
		_class_path = class_path || _class_path;
		_separator = separator || _separator;
		_class_path = (_class_path.lastIndexOf("/") === _class_path.length-1) ? _class_path : _class_path + "/";
	}

	/**
	* Used by f0xy.get() and f0xy.define(). 
	* Get the namespace/Class, or creates it if it does not exist. Also optionally creates Objects in the specified namepsace.
	*
	* @public
	* @param			{String|Object}	identifier			The fully qualified namespace.
	* @param			{Boolean}			autoCreate			Whether or not to create a blank object if the namespace does not yet exist.
	* @param			{Object}				[classes]			An object of class definitions which will be added to the namespace.
	* @returns		{Object}										The object that represents the fully qualified namespace passed in as the first argument.
	* @private
	*/

	_f0xy.namespace = function(identifier, autoCreate, classes){
		classes = classes || false;
		var ns = window;
		if(identifier != '' && !_typeCheck(identifier, o, f)){
			var parts = identifier.split(_separator);
			for (var i = 0; i < parts.length; i++) {
				if(!ns[parts[i]]){
					if(autoCreate){
						ns[parts[i]] = {};
					}
					else{
						return false;
					}
				}
				ns = ns[parts[i]];
			}
		}
		else if(_typeCheck(identifier, o)){ns = identifier;}

		if(classes !== false){

			if(!classes.require){classes.require = [];}
			
			for(var className in classes){				
				
				var qualifiedName = identifier + _separator + className;

				if(classes[className].extendedFrom){
					classes.require.push(classes[className].extendedFrom);
				}

				if(classes[className].toExtend){					
					if(_extendQueue.indexOf(qualifiedName) === -1){
						_extendQueue.push(qualifiedName);
					}
				}

				if(className !== "require"){
					
					var c = classes[className];

					c.nsID = identifier;
					c.ns = ns;
					c.className = className;

					if("require" in classes && classes.require.length > 0){
						c.dependencies = ((c.dependencies) ? c.dependencies : []).concat(classes.require);

						_f0xy.require(classes.require);
					}

					if(_f0xy.isClass(c) && c.prototype){
						c.prototype.nsID = identifier;
						c.prototype.ns = ns;
						c.prototype.className = className;

						if("require" in classes && classes.require.length > 0){
							c.prototype.dependencies = ((c.prototype.dependencies) ? c.prototype.dependencies : []).concat(classes.require);
						}
					}

					ns[className] = c;
				}
			}
		}

		return ns;
	}	

	/**
	* Gets the object by it's fully qualified identifier.
	*
	* @public
	* @param			{String}				identifier			The identifier to get
	* @returns		{Object|Boolean}							The object that represents the identifier or False if it has not yet been defined.
	*/

	_f0xy.get = function(identifier){
		return _f0xy.namespace(identifier, false);
	}

	/**
	* Defines Classes under the given namespace.
	*
	* @public
	* @param			{String}				identifier			The namespace to define the Classes under.
	* @param			{Object}				[classes]			An object of class definitions which will be added to the namespace
	* @returns		{Object}										The object that represents the namespace passed in as the first argument.
	*/
	_f0xy.define = function(identifier, classes){
		return _f0xy.namespace(identifier, true, classes);
	}

	/**
	* Gets the URL for a given identifier.
	*
	* @public
	* @param		 	{String}			identifier			The fully qualified name to look up.
	* @returns		{String}									The URL of the file that maps to the fully qualified name.
	*/

	_f0xy.getURL = function(identifier) {
		
		if(_classMappings[identifier]){
			return _classMappings[identifier];
		}
		var regexp = new RegExp('\\' + _separator, 'g');
		return _class_path + identifier.replace(regexp, '/') + '.js';
	}

	/**
	* Checks to see whether the given fully qualified name or Object is a f0xy class. (Checks for .isClass)<br>
	* NOTE: Classes that have not yet loaded all of their dependencies, will return FALSE for this check.
	*
	* @public
	* @param			{String|Object}		identifier			The fully qualfied class name, or an Object.
	* @returns		{Boolean}										Whether or not this is a Class.
	*/

	_f0xy.isClass = function(identifier){
		identifier = (!_typeCheck(identifier, o, f)) ? _f0xy.namespace(identifier, false) : identifier;
		return (identifier) ? identifier.isClass : false;
	}

	/**
	* Extends a given class asynchronously.
	*
	* @public
	* @param			{String}			identifier			The fully qualified name of the Class you want to extend.
	* @param			{Object}			obj					A new Class Object
	* @returns		{Object}									The extended Class, or, if still waiting on dependencies, the original Object with a few more properties for internal f0xy use.
	*/ 

	_f0xy.extend = function(identifier, obj){
		
		// If the Class exists and is a f0xy class, then return the extended object.
		if(_f0xy.isClass(identifier)){
			obj = _f0xy.get(identifier).extend(obj);			
		}
		else{
			obj.toExtend = true;
		}

		obj.extendedFrom = identifier;

		return obj;
	}

	/**
	* Imports properties from the specified namespace to the global space (ie. under window)
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
	* @param	 	{String|Array}		identifiers		The fully qualfiied name(s) to import into the global namespace.
	*/
	 
	_f0xy.use = function(identifiers){
		
		f0xy.unuse(identifiers);

		if(!_typeCheck(identifiers, o) && !identifiers.sort){
			identifiers = new Array(identifiers);
		}

		for (var i = 0; i < identifiers.length; i++) {
			
			var identifier = identifiers[i];	
			
			var parts = identifier.split(_separator);
			var target = parts.pop();
			var ns = _f0xy.get(parts.join(_separator), false);
			
			if (target === '*') {
				// imports all Classes/namespaces under the given namespace
				for(var objectName in ns){
					_origWindowNS[objectName] = (window[objectName]) ? window[objectName] : null;
					window[objectName] = ns[objectName];
				}
			}
			else{
				// imports only the specified Class/namespace
				if(ns[target]){
					_origWindowNS[target] = (window[target]) ? window[target] : null;
					window[target] = ns[target];
				}
			}
		}
	}


	/**
	* Clears all temporary global namespacing mappings created by f0xy.use(). This method has no arguments, it clears all
	* temporary namespaces.
	* 
	* @see f0xy.use
	*
	* @public
	*/

	_f0xy.unuse = function(){

		for(var prop in _origWindowNS){
			window[prop] = _origWindowNS[prop];
			if(window[prop] === null){
				delete window[prop];
			}
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
	* @param		{String}					file					The path of a JS file.
	* @param	 	{String|Array}			classes				Fully qualfiied name(s) of class(es)
	* @param		{Boolean}				[doLoad=false]		Whether or not to subsequently call f0xy.require()
	* @param 	{Function}				[callback=null]	If doLoad=true, the callback function to call once the file has been loaded.
	*/

	_f0xy.provides = function(file, classes, doLoad, callback){

		// If classes is a String, create an array
		if(!_typeCheck(classes, o) && !classes.sort){
			classes = new Array(classes);
		}

		// If the file is not absolute, prepend the class_path
		file = (!new RegExp("(http://|/)[^ :]+").test(file)) ? _class_path + file : file;

		for(var i = 0; i < classes.length; i ++){
			_classMappings[classes[i]] = file;
		}

		if(doLoad){
			_f0xy.require(classes, callback);
		}
	}

	/**
	* Asyncrhonously loads in js files for the classes specified.
	* If the classes have already been loaded, or are already defined, the callback function is invoked immediately.
	*
	* @public
	* @param	 {String|Array}		classes					The fully qualified names of the class(es) to load.
	* @param	 {Function}				completeFunc			The function to call once all classes (and their dependencies) have been loaded.
	*/

	_f0xy.require = function(classes, completeFunc){

		if(_typeCheck(classes, s)){classes = [classes];}
		
		var classFiles = [];
		
		for(var i = 0; i < classes.length; i ++){
			var identifier = classes[i];

			if((_loadedClasses.indexOf(identifier) === -1) && !_f0xy.get(identifier)){	
				classFiles.push(_f0xy.getURL(identifier));
			}
		}

		if(classFiles.length > 0){	
			var queue = {
				classes: classes,
				classFiles: classFiles,
				complete: completeFunc
			};
			
			_loadQueues.push(queue);

			_load(classFiles, function(){
					_loadedClasses = _loadedClasses.concat(classes);
					_checkExtendQueue();
					_checkLoadQueues();
				}
			);
		}

		else{
			_loadedClasses = _loadedClasses.concat(classes);

			if(completeFunc){
				completeFunc.call();
			}
		}
	}

	return _f0xy;

})();
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
});f0xy.define("f0xy", {

	/** @lends f0xy.Class# */ 

	Class : f0xy.extend("f0xy.$$__BaseClass__$$", {

		isClass: true,

		/**
		*
		* The base f0xy Class. All Classes are required to be descendants
		* of this class, either directly, or indirectly.
		*
		* @constructs
		*/
		init: function(){
			
		},

		/** 
		* Imports all the dependencies (determined by what is in the "require" array and what Class this Class extends) to the global namespace temporarily.
		* Basically, it just does: <code>f0xy.use(this.dependencies);</code>
		*
		* @see f0xy.use
		*/
		use_dependencies : function(){
			if(this.dependencies){
				f0xy.use(this.dependencies)
			}
		},

		/** 
		* Local version of window.setTimeout that keeps scope of <i>this</i>.<br>
		* 
		* @returns {Number}		 A timeout ID
		*/
		setTimeout : function(func, delay){
			return window.setTimeout(this.proxy(func), delay);
		},

		/** 
		* Local version of window.setInterval that keeps scope of <i>this</i>.<br>
		*
		* @returns {Number}		 An interval ID
		*/
		setInterval : function(func, delay){
			return window.setInterval(this.proxy(func), delay);
		},

		/** 
		* Shorthand for <i>func.bind(this)</i><br>
		* or rather, <i>$.proxy(func, this)</i> in jQuery terms
		*
		* @returns {Function}		 The proxied function
		*/
		proxy: function(func){
			return func.bind(this);
		}

	})

});
