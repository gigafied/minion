
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

var f0xy = (function(root){

	"use strict";

	// If Array.indexOf is not defined, let's define it.
   Array.prototype.indexOf = Array.prototype.indexOf || function(o,i){for(var j=this.length,i=i<0?i+j<0?0:i+j:i||0;i<j&&this[i]!==o;i++);return j<=i?-1:i}

	// If Function.bind is not defined, let's define it.
	Function.prototype.bind = Function.prototype.bind || function(){
		var __method = this, args = Array.prototype.slice.call(arguments), object = args.shift();
		return function(){
			var local_args = args.concat(Array.prototype.slice.call(arguments));
			if (this !== _root) local_args.push(this);
			return __method.apply(object, local_args);
		}
	}

	var _classMappings = [];

	var _separator = ".";
	var _class_path = "";

	var _root = root;
	var _origRootNS = {};
	var _initialized = false;

	var _loadQueue = [];
	var _extendQueue = [];

	var _waitID = null;
	var _waitingForLoad = [];
	var _requestedFiles = [];
	
	/************* PRIVATE METHODS ***************/

	var isArray = Array.isArray || function(obj){
		return toString.call( obj ) == '[object Array]';
	}

	var isObject = function(obj){
		return Object(obj) === obj;
	}

	var isString = function(s) {
		return typeof s == 'string';
	}

	var isFunction = function(fn){
		return toString.call(fn) == '[object Function]';
	}

	var strToArray = function(s){
		return (isString(s)) ? [s] : s;
	}

	var concatArray = function(a, b){
		b = b || [];
		return ((a) ? a : []).concat(b);		
	}

	var sTimeout = setTimeout;

	/** @private */
	var _checkExtendQueue = function(){
		var eq = _extendQueue;

		for(var i = eq.length - 1; i >= 0; i --){

			var ns = eq[i].split(_separator);
			var id = ns.splice(ns.length-1,1)[0];
			ns = _f0xy.get(ns.join(_separator), false);

			if(ns[id].toExtend){
				var superClass = _f0xy.get(ns[id].extendedFrom, false);
				if(superClass.isClass){

					ns[id].toExtend = false;
					delete ns[id].toExtend;
					
					ns[id] = _f0xy.extend(superClass, ns[id]);

					eq.splice(i, 1);
					sTimeout(_checkExtendQueue, 0);
					return;
				}
			}
		}
		_checkLoadQueue();
	}

	/** @private */
	var _checkLoadQueue = function(){

		for(var i = _loadQueue.length -1; i >= 0; i --){

			var q = _loadQueue[i];
			var dependenciesLoaded = true;
			
			for(var j = 0; j < q.c.length; j ++){
				dependenciesLoaded = _areDependenciesLoaded(q.c[j]);
				if(!dependenciesLoaded){break;}
			}
			if(dependenciesLoaded){
				if(q.cb){
					// 0 ms delay to make sure queue.callback does not get called prematurely, in some instances.
					q.cb();
				}
				_loadQueue.splice(i, 1);
			}
		}
	}

	// Recursively checks dependencies
	var _areDependenciesLoaded = function(o){
		o = _f0xy.get(o, false);
		if(!o.isClass){return false}
		if(o.dependencies){
			for(var i = 0; i < o.dependencies.length; i ++){
				if(!_areDependenciesLoaded(o.dependencies[i])){
					return false;
				}
			}
		}
		return true;
	}

	var _checkWaitQueue = function(){
		
		var w = _waitingForLoad;

		if(_waitID){clearTimeout(_waitID);}
		
		for(var i = 0; i < w.length; i ++){
			var o = w[i];
			o.e += 50;

			if(_f0xy.isClass(o.c)){
				o.s.onload();
			}
			else if(o.e >= _f0xy.errorTimeout){
				o.s.onerror();
			}
		}

		if(w.length > 0){
			_waitID = sTimeout(_checkWaitQueue, 50);
		}
	}

	/**
	* Does all the loading of JS files
	*
	* @param		files 		String or array of the files to be loaded.
	* @param		classes 		The classes that match up to the files to be loaded.
	* @private 
	*/
	
	var _load = function(q){

		var doc = document;
		var body = "body";

		_loadQueue.push(q);

		function inject(f, c){

			if(_requestedFiles.indexOf(f) < 0){

				if(!doc[body]){return sTimeout(inject, 0, f, c);}

				var script = doc.createElement("script");
		     	script.async = true;
		      script.src = f;
				
				var injectObj = {
					f : f, 		// File
					c : c, 		// Class
					e : 0, 		// Elapsed Time
					s : script 	// Script
				};

				_requestedFiles.push(f);			
				_waitingForLoad.push(injectObj);

		      script.onreadystatechange = script.onload = function(e){
		      	if(_f0xy.isClass(c)){						
			        injectObj.s.onload = script.onreadystatechange = null;
			        _waitingForLoad.splice(_waitingForLoad.indexOf(injectObj), 1);
			   	}
		      };

		      script.onerror = function(e){
					_waitingForLoad.splice(_waitingForLoad.indexOf(injectObj), 1);
					throw new Error(injectObj.c + " failed to load. Attempted to load from file: " + injectObj.f);
		      	injectObj.s.onerror = null;
		      	_waitingForLoad.splice(_waitingForLoad.indexOf(injectObj), 1);	
		      }
		      
		      // Append the script to the document body
		   	doc[body].appendChild(script);
			}
		}

		for(var i = 0; i < q.f.length; i ++){
			inject(q.f[i], q.c[i]);
		}

		/*
			onload and onreadystatechange are unreliable, mainly because of browser cache, thus we have to
			set a timeout that checks for the definition of each class. Times out at 10 seconds (can be changed through
			setting f0xy.errorTimeout = ms)
		*/
		_waitID = sTimeout(_checkWaitQueue, 50);
	}

	/**
	* Used by f0xy.get() and f0xy.define(). 
	* Get the namespace/Class, or creates it if it does not exist. Also optionally creates Objects in the specified namepsace.
	*
	* @public
	* @param			{String|Object}	id						The fully qualified namespace.
	* @param			{Boolean}			autoCreate			Whether or not to create a blank object if the namespace does not yet exist.
	* @param			{Object}				[classes]			An object of class definitions which will be added to the namespace.
	* @returns		{Object}										The object that represents the fully qualified namespace passed in as the first argument.
	* @private
	*/

	var _namespace = function(id, autoCreate, classes){

		classes = classes || false;
		var ns = _f0xy.ns;

		if(id != '' && !isObject(id) && !isFunction(id)){
			var parts = id.split(_separator);

			if(parts[0] === "f0xy"){
				ns = _f0xy;
				parts.splice(0,1);
			}

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

		else if(id != ""){ns = id;}

		if(classes){

			classes.require = concatArray(classes.require);
			var cr = classes.require;
			
			for(var className in classes){				

				if(className !== "require"){

					var qualifiedName = id + _separator + className;
					var c = classes[className];

					if(c.extendedFrom){
						cr.push(c.extendedFrom);
					}

					if(c.toExtend){					
						if(_extendQueue.indexOf(qualifiedName) < 0){
							_extendQueue.push(qualifiedName);
						}
					}
					
					c.nsID = id;
					c.ns = ns;
					c.className = className;

					if(cr.length > 0){
						c.dependencies = concatArray(c.dependencies, cr);
						_f0xy.require(cr);
					}

					if(_f0xy.isClass(c) && c.prototype){
						var proto = c.prototype;
						proto.nsID = id;
						proto.ns = ns;
						proto.className = className;

						if(cr.length > 0){
							proto.dependencies = concatArray(proto.dependencies, cr);
						}
					}

					ns[className] = c;
				}
			}
		}

		return ns;
	}		

	/************* END PRIVATE METHODS ***************/	


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
	* Configure f0xy. Call to update the base class path, or to change the default separator (".").
	* 
	* @public
	* @param		 {String}			[separator="."]		Namespace separator
	* @param		 {String}			[class_path="js/"]	The root path of all your classes. Can be absolute or relative.
	*/

	_f0xy.configure = function(class_path, separator, useRootNS){
		_class_path = class_path || _class_path;
		_separator = separator || _separator;
		_class_path = (_class_path.lastIndexOf("/") === _class_path.length-1) ? _class_path : _class_path + "/";

		if(!_initialized){
			if(useRootNS !== false){
				for(var i in _f0xy.ns){
					if(!_root[i]){
						_root[i] = _f0xy.ns[i];
					}
				}
				_f0xy.ns = _root;
			}
			_initialized = true;
		}
	}

	/**
	* Gets the object by it's fully qualified identifier.
	*
	* @public
	* @param			{String}				id						The identifier to get
	* @returns		{Object|Boolean}							The object that represents the identifier or False if it has not yet been defined.
	*/

	_f0xy.get = function(id){
		return _namespace(id, false);
	}

	/**
	* Defines Classes under the given namespace.
	*
	* @public
	* @param			{String}				id						The namespace to define the Classes under.
	* @param			{Object}				[classes]			An object of class definitions which will be added to the namespace
	* @returns		{Object}										The object that represents the namespace passed in as the first argument.
	*/
	_f0xy.define = function(id, classes){
		var r = _namespace(id, true, classes);
		_checkExtendQueue();
		return r;
	}

	/**
	* Gets the URL for a given identifier.
	*
	* @public
	* @param		 	{String}			id						The fully qualified name to look up.
	* @returns		{String}									The URL of the file that maps to the fully qualified name.
	*/

	_f0xy.getURL = function(id) {
		
		if(_classMappings[id]){
			return _classMappings[id];
		}

		return _class_path + id.replace(new RegExp('\\' + _separator, 'g'), '/') + '.js';
	}

	/**
	* Checks to see whether the given fully qualified name or Object is a f0xy class. (Checks for .isClass)<br>
	* NOTE: Classes that have not yet loaded all of their dependencies, will return FALSE for this check.
	*
	* @public
	* @param			{String|Object}		id						The fully qualfied class name, or an Object.
	* @returns		{Boolean}										Whether or not this is a Class.
	*/

	_f0xy.isClass = function(id){
		id = (!isObject(id) && !isFunction(id)) ? _namespace(id, false) : id;
		return (id) ? id.isClass : false;
	}

	/**
	* Extends a given class asynchronously.
	*
	* @public
	* @param			{String}			id						The fully qualified name of the Class you want to extend.
	* @param			{Object}			obj					A new Class Object
	* @returns		{Object}									The extended Class, or, if still waiting on dependencies, the original Object with a few more properties for internal f0xy use.
	*/ 

	_f0xy.extend = function(id, obj){
		
		// If the Class exists and is a f0xy class, then return the extended object.
		if(_f0xy.isClass(id)){
			obj = _f0xy.get(id).extend(obj);			
		}
		else{
			obj.toExtend = true;
		}

		obj.extendedFrom = id;

		return obj;
	}

	/**
	* Imports properties from the specified namespace to the global space (ie. under _f0xy.ns, or _root)
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
	* @param	 	{String|Array}		ids		The fully qualfiied name(s) to import into the global namespace.
	*/
	 
	_f0xy.use = function(ids){

		ids = strToArray(ids);

		for (var i = 0; i < ids.length; i++) {
			
			var id = ids[i];

			var obj = _f0xy.get(id, true);
			var ns = id.split(_separator);
			var id = ns.splice(ns.length-1,1)[0];
			ns = _f0xy.get(ns.join(_separator), false);
			
			if(id === '*'){
				// imports all Classes/namespaces under the given namespace
				for(var n in ns){
					_origRootNS[n] = (_f0xy.ns[n]) ? _f0xy.ns[n] : null;
					_f0xy.ns[n] = ns[n];
				}
			}
			else{
				// imports only the specified Class/namespace
				if(ns[id]){
					_origRootNS[id] = (_f0xy.ns[id]) ? _f0xy.ns[id] : null;
					_f0xy.ns[id] = ns[id];
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
		for(var prop in _origRootNS){
			_f0xy.ns[prop] = _origRootNS[prop];
			if(_f0xy.ns[prop] === null){
				delete _f0xy.ns[prop];
			}
		}
		_origRootNS = {};
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
		classes = strToArray(classes);

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
	* @param	 {String|Array}		ids				The fully qualified names of the class(es) to load.
	* @param	 {Function}				callback			The function to call once all classes (and their dependencies) have been loaded.
	*/

	_f0xy.require = function(ids, callback){

		if(!_initialized){f0xy.configure();}

		ids = strToArray(ids);
		
		var files = [];
		var classes = [];

		for(var i = 0; i < ids.length; i ++){

			var id = ids[i];
			var file = _f0xy.getURL(id);

			if((_requestedFiles.indexOf(file) < 0) && !_f0xy.get(id)){	
				files.push(file);
				classes.push(id);
			}
		}

		if(files.length > 0){

			var q = {
				f  : files,
				c  : classes,
				cb : callback
			};
			
			_load(q);
		}

		else if(callback){
			callback();
		}
	}

	return _f0xy;

})(this);
