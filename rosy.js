
/**

@fileOverview

	<h4>Rosy JS - Simple JS Inheritance</h4>
	<span>RED Interactive Agency</span>

	<p>Copyright (c) 2011 by RED Interactive Agency</p>

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
		
	@version 2.0.1

	@requires yepnope-1.0.2+ (or Modernizr 2 w/ Modernizr.load)
*/


/**
		Global Static Rosy Class with static methods.
		@static
		@class
 */ 

var Rosy = (function(){

	// If Array.indexOf is not defined, let's define it.
	Array.prototype.indexOf = Array.prototype.indexOf || function(o,i){for(var j=this.length,i=i<0?i+j<0?0:i+j:i||0;i<j&&this[i]!==o;i++);return j<=i?-1:i}

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
	var _class_path = "js/";
	var _loadQueues = [];
	var _extendQueue = [];
	var _origWindowNS = {};

	/**
	* @exports _rosy as Rosy 
	* @class
	*/
	var _rosy = {};

	/**
	 * Configure Rosy. Not necessary, unless you want to change the default class path or Namespace separator.
	 * 
	 * @public
	 * @param		 {String}			[separator="."]		Namespace separator
	 * @param		 {String}			[class_path="js/"]	The root path of all your classes. Can be absolute or relative.
	 */

	_rosy.configure = function(separator, class_path){
		_separator = separator || _separator;
		_class_path = class_path || _class_path;
	}

	/**
	 * Gets the URL for a given identifier.
	 *
	 * @public
	 * @param		 {String}			identifier			The namespace identifier
	 * @returns		 {String}									The URL of the package/class.
	 */

	_rosy.getIdentifierURL = function(identifier) {
		
		if(_classMappings[identifier]){
			return _classMappings[identifier];
		}
		var regexp = new RegExp('\\' + _separator, 'g');
		return _class_path + identifier.replace(regexp, '/') + '.js';
	}

	/**
	 * Checks to see whether the given identifier or Class is a rosy class. (Checks for .isClass)<br>
	 * NOTE: Classes that have not yet loaded all of their dependencies, will return FALSE for this check.
	 *
	 * @public
	 * @param		{String|Object}	identifier			The namespace identifier, the Class or an instance of the class.
	 * @returns		{Boolean}									Whether or not this is a Class.
	 */

	_rosy.isClass = function(identifier){
		
		if(typeof identifier === "string"){
			var parts = identifier.split(_separator);
			var identifierClass = window;
			
			for (var j = 0; j < parts.length; j++){
				if(!identifierClass[parts[j]]){
					return false;
				}
				identifierClass = identifierClass[parts[j]];
			}
		}

		else{
			identifierClass = identifier;
		}
		
		if(typeof identifierClass === "object" || typeof identifierClass === "function"){
			return identifierClass.isClass;
		}

		return false;
	}

	/**
	 * Gets the namespace/Class, or creates it if it does not exist. Also optionally creates Objects in the specified namepsace.
	 *
	 * @public
	 * @param		{String}				namespace			The namespace/package as a {String}
	 * @param		{Object}				[classes]			An object of class definitions which will be added to the namespace
	 * @returns		{Object}										The object that represents the namespace passed in as the first argument.
	 */

	_rosy.namespace = function(namespace, classes){
		classes = classes || false;
		var ns = window;

		if(namespace != '') {
			var parts = namespace.split(_separator);
			for (var i = 0; i < parts.length; i++) {
				if (!ns[parts[i]]){
					ns[parts[i]] = {};
				}
				ns = ns[parts[i]];
			}
		}

		if(classes !== false){
			
			for(var className in classes){
				if(classes[className].superClassIdentifier){
					if(!classes.requires){classes.requires = [];}
					classes.requires.push(classes[className].superClassIdentifier);
					if(_extendQueue.indexOf(namespace + _separator + className) === -1){
						_extendQueue.push(namespace + _separator + className);
					}
				}
			}

			if("requires" in classes){
				
				for(var className in classes){
					if(className !== "requires"){
						if(!_rosy.isClass(classes[className])){
							classes[className].dependencies = classes.requires;
							classes[className].nsID = namespace;
							classes[className].ns = ns;
							classes[className].className = className;
						}
						else{
							classes[className].prototype.dependencies = classes.requires;
							classes[className].prototype.nsID = namespace;
							classes[className].prototype.ns = ns;
							classes[className].prototype.className = className;
						}

						ns[className] = classes[className];
					}
				}
				_rosy.require(classes.requires, function(){});
			}
		}

		return ns;
	}

	/**
	 * Extends a given class asynchronously.
	 *
	 * @public
	 * @param		 {String}			identifier			The fully qualified class name of the class you want to extend.
	 * @param		 {Object}			obj					A Class Object
	 * @returns		 {Object}									The extended Class, or, if the Class to be extended has yet to be loaded in, the original Object with a few more properties.
	 */ 

	_rosy.extend = function(identifier, obj){
	 
		// Let's check to see if the Class is already defined...
		var parts = identifier.split(_separator);
		var identifierClass = window;
		
		for (var j = 0; j < parts.length; j++){
			
			if(!identifierClass[parts[j]]){
				break;
			}

			identifierClass = identifierClass[parts[j]];
		}
		
		// If the Class exists and is a Rosy class, then return the extended object.
		if(identifierClass.isClass){
			obj = identifierClass.extend(obj);			
		}

		else{
			obj.superClassIdentifier = identifier;
		}

		obj.extendedFrom = identifier;

		return obj;
	}

	/**
	 * Imports properties from the specified namespace to the global space (ie. under window)
	 *
	 * The identifier {String} can contain the * wildcard character as its last segment (eg: com.test.*) 
	 * which will import all properties from the namespace.
	 * 
	 * If not, the targeted namespace will be imported (ie. if com.test is imported, the test object 
	 * will now be global).
	 * 
	 * Only use Rosy.use() if you know the Class/package has already been defined (loaded).
	 * Because Rosy.use() imports objects/namespaces into the global namespace (window),
	 * it is highly recommended that you call Rosy.unuse() to clean up afterwards.
	 *
	 * Rosy.unuse() is automatically called after every Class method.
	 *
	 * @public
	 * @param	 {String|Array}		identifier		The namespace as a String or an Array of namespaces
	 */
	 
	_rosy.use = function(identifier){
		
		Rosy.unuse(identifier);

		var identifiers;

		if(typeof(identifier) !== 'object' && !identifier.sort){
			identifiers = new Array(identifier);
		}
		else{
			identifiers = identifier;
		}

		for (var i = 0; i < identifiers.length; i++) {
			identifier = identifiers[i];	
			
			var parts = identifier.split(_separator);
			var target = parts.pop();
			var ns = _rosy.namespace(parts.join(_separator));
			
			if (target === '*') {
				// imports all objects from the identifier, can't use include() in that case
				for (var objectName in ns) {
					_origWindowNS[objectName] = (window[objectName]) ? window[objectName] : null;
					window[objectName] = ns[objectName];
				}
			}
			else{
				// imports only one object
				if(ns[target]){
					_origWindowNS[target] = (window[target]) ? window[target] : null;
					window[target] = ns[target];
				}
			}
		}
	}


	/**
	 * The opposite of Rosy.use() (who would'a thunk it!!)
	 *
	 * This method is automatically called after every Class method.
	 *
	 * @public
	 * @param	 {String|Array}		identifier		The namespace as a String or an Array of namespaces
	 */

	_rosy.unuse = function(identifier){

		identifier = identifier || "*";
		var identifiers;

		if(typeof(identifier) !== 'object' && !identifier.sort){
			identifiers = new Array(identifier);
		}
		else{
			identifiers = identifier;
		}

		for (var i = 0; i < identifiers.length; i++) {
			
			identifier = identifiers[i];

			var parts = identifier.split(_separator);
			var target = parts.pop();

			if(target === '*'){
				for(var prop in _origWindowNS){
					window[prop] = _origWindowNS[prop];
					if(window[prop] === null){
						delete window[prop];
					}
				}
			}
			else{
				// imports only one object
				if(_origWindowNS[target]){
					window[target] = _origWindowNS[target];
					if(window[target] === null){
						delete window[target];
					}
				}
			}
		}
	}


	/**
	 * Tells Rosy that x file provides these Class definitions.
	 * Where x file = filePath and classes is an aray of the Classes that xFile defines.
	 * Useful in cases where you group specific things into minfiied js files.
	 *
	 * Rosy.provides can load the file right away, by passing doLoad as true, and a callback function.
	 * Otherwise, it just maps the classes to the filePath for any subsequent calls to Rosy.require() which might refer
	 * to said classes.
	 *
	 * @public
	 * @param	 {String}					filePath			The path to the JS file.
	 * @param	 {String|Array}			identifier		The namespace as a {String} or an {Array} of namespaces
	 */

	_rosy.provides = function(filePath, classes, doLoad, callback){

		// If classes is a String, create an array
		if(typeof(classes) !== 'object' && !classes.sort){
			classes = new Array(classes);
		}

		for(var i = 0; i < classes.length; i ++){
			_classMappings[classes[i]] = filePath;
		}

		if(doLoad){
			_rosy.require(classes, callback);
		}
	}


	/**
	 * Imports the packages/classes for a given identifier. Loads them if neccessary and includes them in the global namespace.
	 *
	 * @public
	 * @param	 {String|Array}		classes					The class(es) to load/include.
	 * @param	 {Function}				completeFunc			The function to call once all classes (and their dependencies) have been included/loaded.
	 */

	_rosy.require = function(classes, completeFunc){

		if(typeof classes === "string"){classes = [classes];}
		
		var classFiles = [];
		
		for(var i = 0; i < classes.length; i ++){
			var identifier = classes[i];

			if((_loadedClasses.indexOf(identifier) === -1) && !_rosy.isClass(identifier)){	
				_loadedClasses.push(identifier);
				classFiles.push(_rosy.getIdentifierURL(identifier));
			}
		}

		if(classFiles.length > 0){	
			var queue = {
				classes: classes,
				classFiles: classFiles,
				complete: completeFunc
			};
			
			_loadQueues.push(queue);

			yepnope({

				load : classFiles,
				callback : function(){

					for(var i = _extendQueue.length - 1; i >= 0; i --){
						
						var packageArray = _extendQueue[i].split(_separator);
						var className	= packageArray.splice(packageArray.length-1, 1);
						var namespace = packageArray.join(_separator);
						
						var packageObj = _rosy.namespace(namespace);
						
						if(typeof packageObj[className].superClassIdentifier !== "undefined"){
							var superClass = _rosy.namespace(packageObj[className].superClassIdentifier);
							if(superClass.isClass){
								
								var dependencies = packageObj[className].dependencies;
								var scID = packageObj[className].superClassIdentifier;

								packageObj[className].superClassIdentifier = null;
								delete packageObj[className].superClassIdentifier;
								
								packageObj[className] = superClass.extend(packageObj[className]);
								
								packageObj[className].dependencies = dependencies;

								_extendQueue.splice(i, 1);

							}
						}
					}

					for(var i = _loadQueues.length -1; i >= 0; i --){
						var queue = _loadQueues[i];
						var dependenciesLoaded = true;
						
						for(var j = 0; j < _loadQueues[i].classes.length; j ++){
							
							if(!_rosy.isClass(_loadQueues[i].classes[j])){
								dependenciesLoaded = false;
								break;
							}

							var obj = _rosy.namespace(_loadQueues[i].classes[j]);
							
							if(obj.dependencies){
								for(var k = 0; k < obj.dependencies.length; k ++){
									if(_loadedClasses.indexOf(obj.dependencies[i]) === -1){
										dependenciesLoaded = false;
										break;
									}
								}
							}
							if(!dependenciesLoaded){break;}
						}
						if(dependenciesLoaded){
							queue.complete.call();
							_loadQueues.splice(i, 1);
						}
					}
				}
			});
		}

		else{

			completeFunc.call();
		}
	}

	return _rosy;

})();

/**
	The Rosy Base Class
	Simple JavaScript Inheritance

	Taken from: http://ejohn.org/blog/simple-javascript-inheritance/
	MIT Licensed.

	@class
	@private
 */ 

Rosy.namespace("org.rosyjs", {
	
	// ## Rosy Base Class.
	// org.rosyjs.Class is the ONLY Class to extend this directly, do not directly extend this Class.
	$$__BaseClass__$$ : (function(doInitialize){
		
		// The base Class implementation (does nothing)
		var _BaseClass = function(){};

		_BaseClass.isClass = true;

		// Create a new Class that inherits from this class
		_BaseClass.extend = function extend(obj){
			
			var fnTest =	(/xyz/).test(function(){var xyz;}) ? (/\b_super\b/) : (/.*/);

			// We set this to false, so we don't initialize a new instance every time we extend a Class.
			doInitialize = false;
			var prototype = new this();
			// Set it back to true, now that our "prototype" instance exists.
			doInitialize = true;

			// Make a deep copy of this object, removing all references that might affect other instances.
			var _this = this;

			// Copy the properties over onto the new prototype
			for(name in obj){
				// Check if we're overwriting an existing function
				prototype[name] = (typeof obj[name] === "function") && (typeof _this.prototype[name] === "function") && fnTest.test(obj[name]) ? (function (name, fn) {
					return function(){
						this._super = _this.prototype[name];
						var ret = fn.apply(this, arguments);
						this._super = null;
						delete this._super;					 
						Rosy.unuse();
					};
				}(name, obj[name])) : obj[name];
			}

			// The dummy class constructor
			var Class = function(){
				this.isClass = true;

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
			
			return Class;
		};
		
		return _BaseClass;
	})()
});

Rosy.namespace("org.rosyjs", {

	/** @lends org.rosyjs.Class# */

	Class : Rosy.extend("org.rosyjs.$$__BaseClass__$$", {

		/** 
		*
		* The base Rosy Class. All Classes are required to be descendants
		* of this class, either directly, or indirectly.
		*
		* @constructs 
		*/
		init: function(){
			
		},

		/** 
		* Imports all the dependencies (determined by what is in the "requires" array and what Class this Class extends) to the global namespace temporarily.
		* Basically, it just does: <code>Rosy.use(this.dependencies);</code>
		*
		* @see Rosy.use
		*/
		import_dependencies : function(){
			if(this.dependencies){
				Rosy.use(this.dependencies)
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