/*yepnope1.0.2|WTFPL*/
// yepnope.js
// Version - 1.0.2
//
// by
// Alex Sexton - @SlexAxton - AlexSexton[at]gmail.com
// Ralph Holzmann - @ralphholzmann - ralphholzmann[at]gmail.com
//
// http://yepnopejs.com/
// https://github.com/SlexAxton/yepnope.js/
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.
// Also available as Modernizr.load via the Modernizr Project
//
( function ( window, doc, undef ) {

var docElement            = doc.documentElement,
    sTimeout              = window.setTimeout,
    firstScript           = doc.getElementsByTagName( 'script' )[ 0 ],
    toString              = {}.toString,
    execStack             = [],
    started               = 0,
    // Before you get mad about browser sniffs, please read:
    // https://github.com/Modernizr/Modernizr/wiki/Undetectables
    // If you have a better solution, we are actively looking to solve the problem
    isGecko               = ( 'MozAppearance' in docElement.style ),
    isGeckoLTE18          = isGecko && !! doc.createRange().compareNode,
    isGeckoGT18           = isGecko && ! isGeckoLTE18,
    insBeforeObj          = isGeckoLTE18 ? docElement : firstScript.parentNode,
    // Thanks to @jdalton for showing us this opera detection (by way of @kangax) (and probably @miketaylr too, or whatever...)
    isOpera               = window.opera && toString.call( window.opera ) == '[object Opera]',
    isWebkit              = ( 'webkitAppearance' in docElement.style ),
    isNewerWebkit         = isWebkit && 'async' in doc.createElement('script'),
    strJsElem             = isGecko ? 'object' : ( isOpera || isNewerWebkit ) ? 'img' : 'script',
    strCssElem            = isWebkit ? 'img' : strJsElem,
    isArray               = Array.isArray || function ( obj ) {
      return toString.call( obj ) == '[object Array]';
    },
    isObject              = function ( obj ) {
      return Object(obj) === obj;
    },
    isString              = function ( s ) {
      return typeof s == 'string';
    },
    isFunction            = function ( fn ) {
      return toString.call( fn ) == '[object Function]';
    },
    globalFilters         = [],
    prefixes              = {},
    handler,
    yepnope;

  /* Loader helper functions */
  function isFileReady ( readyState ) {
    // Check to see if any of the ways a file can be ready are available as properties on the file's element
    return ( ! readyState || readyState == 'loaded' || readyState == 'complete' );
  }

  function execWhenReady () {
    var execStackReady = 1,
        i              = -1;

    // Loop through the stack of scripts in the cue and execute them when all scripts in a group are ready
    while ( execStack.length - ++i ) {
      if ( execStack[ i ].s && ! ( execStackReady = execStack[ i ].r ) ) {
        // As soon as we encounter a script that isn't ready, stop looking for more
        break;
      }
    }
    
    // If we've set the stack as ready in the loop, make it happen here
    execStackReady && executeStack();
    
  }

  // Takes a preloaded js obj (changes in different browsers) and injects it into the head
  // in the appropriate order
  function injectJs ( oldObj ) {
    var script = doc.createElement( 'script' ),
        done;

    script.src = oldObj.s;

    // Bind to load events
    script.onreadystatechange = script.onload = function () {

      if ( ! done && isFileReady( script.readyState ) ) {

        // Set done to prevent this function from being called twice.
        done = 1;
        execWhenReady();

        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
      }
    };

    // 404 Fallback
    sTimeout( function () {
      if ( ! done ) {
        done = 1;
        execWhenReady();
      }
    }, yepnope.errorTimeout );

    // Inject script into to document
    // or immediately callback if we know there
    // was previously a timeout error
    oldObj.e ? script.onload() : firstScript.parentNode.insertBefore( script, firstScript );
  }

  // Takes a preloaded css obj (changes in different browsers) and injects it into the head
  // in the appropriate order
  // Many credits to John Hann (@unscriptable) for a lot of the ideas here - found in the css! plugin for RequireJS
  function injectCss ( oldObj ) {

    // Create stylesheet link
    var link = doc.createElement( 'link' ),
        done;

    // Add attributes
    link.href = oldObj.s;
    link.rel  = 'stylesheet';
    link.type = 'text/css';

    // Poll for changes in webkit and gecko
    if ( ! oldObj.e && ( isWebkit || isGecko ) ) {
      // A self executing function with a sTimeout poll to call itself
      // again until the css file is added successfully
      var poll = function ( link ) {
        sTimeout( function () {
          // Don't run again if we're already done
          if ( ! done ) {
            try {
              // In supporting browsers, we can see the length of the cssRules of the file go up
              if ( link.sheet.cssRules.length ) {
                // Then turn off the poll
                done = 1;
                // And execute a function to execute callbacks when all dependencies are met
                execWhenReady();
              }
              // otherwise, wait another interval and try again
              else {
                poll( link );
              }
            }
            catch ( ex ) {
              // In the case that the browser does not support the cssRules array (cross domain)
              // just check the error message to see if it's a security error
              if ( ( ex.code == 1e3 ) || ( ex.message == 'security' || ex.message == 'denied' ) ) {
                // if it's a security error, that means it loaded a cross domain file, so stop the timeout loop
                done = 1;
                // and execute a check to see if we can run the callback(s) immediately after this function ends
                sTimeout( function () {
                  execWhenReady();
                }, 0 );
              }
              // otherwise, continue to poll
              else {
                poll( link );
              }
            }
          }
        }, 0 );
      };
      poll( link );

    }
    // Onload handler for IE and Opera
    else {
      // In browsers that allow the onload event on link tags, just use it
      link.onload = function () {
        if ( ! done ) {
          // Set our flag to complete
          done = 1;
          // Check to see if we can call the callback
          sTimeout( function () {
            execWhenReady();
          }, 0 );
        }
      };

      // if we shouldn't inject due to error or settings, just call this right away
      oldObj.e && link.onload();
    }

    // 404 Fallback
    sTimeout( function () {
      if ( ! done ) {
        done = 1;
        execWhenReady();
      }
    }, yepnope.errorTimeout );
    
    // Inject CSS
    // only inject if there are no errors, and we didn't set the no inject flag ( oldObj.e )
    ! oldObj.e && firstScript.parentNode.insertBefore( link, firstScript );
  }

  function executeStack ( ) {
    // shift an element off of the stack
    var i   = execStack.shift();
    started = 1;

    // if a is truthy and the first item in the stack has an src
    if ( i ) {
      // if it's a script, inject it into the head with no type attribute
      if ( i.t ) {
        // Inject after a timeout so FF has time to be a jerk about it and
        // not double load (ignore the cache)
        sTimeout( function () {
          i.t == 'c' ?  injectCss( i ) : injectJs( i );
        }, 0 );
      }
      // Otherwise, just call the function and potentially run the stack
      else {
        i();
        execWhenReady();      	
      }
    }
    else {
      // just reset out of recursive mode
      started = 0;
    }
  }

  function preloadFile ( elem, url, type, splicePoint, docElement, dontExec ) {

    // Create appropriate element for browser and type
    var preloadElem = doc.createElement( elem ),
        done        = 0,
        stackObject = {
          t: type,     // type
          s: url,      // src
        //r: 0,        // ready
          e : dontExec // set to true if we don't want to reinject
        };

    function onload () {

      // If the script/css file is loaded
      if ( ! done && isFileReady( preloadElem.readyState ) ) {

        // Set done to prevent this function from being called twice.
        stackObject.r = done = 1;

        ! started && execWhenReady();

        // Handle memory leak in IE
        preloadElem.onload = preloadElem.onreadystatechange = null;
        sTimeout(function(){ insBeforeObj.removeChild( preloadElem ) }, 0);
      }
    }

    // Just set the src and the data attributes so we don't have differentiate between elem types
    preloadElem.src = preloadElem.data = url;

    // Don't let it show up visually
    ! isGeckoLTE18 && ( preloadElem.style.display = 'none' );
    preloadElem.width = preloadElem.height = '0';


    // Only if we have a type to add should we set the type attribute (a real script has no type)
    if ( elem != 'object' ) {
      preloadElem.type = type;
    }

    // Attach handlers for all browsers
    preloadElem.onload = preloadElem.onreadystatechange = onload;

    // If it's an image
    if ( elem == 'img' ) {
      // Use the onerror callback as the 'completed' indicator
      preloadElem.onerror = onload;
    }
    // Otherwise, if it's a script element
    else if ( elem == 'script' ) {
      // handle errors on script elements when we can
      preloadElem.onerror = function () {
        stackObject.e = stackObject.r = 1;
        executeStack();
      };
    }

    // inject the element into the stack depending on if it's
    // in the middle of other scripts or not
    execStack.splice( splicePoint, 0, stackObject );

    // The only place these can't go is in the <head> element, since objects won't load in there
    // so we have two options - insert before the head element (which is hard to assume) - or
    // insertBefore technically takes null/undefined as a second param and it will insert the element into
    // the parent last. We try the head, and it automatically falls back to undefined.
    insBeforeObj.insertBefore( preloadElem, isGeckoLTE18 ? null : firstScript );

    // If something fails, and onerror doesn't fire,
    // continue after a timeout.
    sTimeout( function () {
      if ( ! done ) {
        // Remove the node from the dom
        insBeforeObj.removeChild( preloadElem );
        // Set it to ready to move on
        // indicate that this had a timeout error on our stack object
        stackObject.r = stackObject.e = done = 1;
        // Continue on
        execWhenReady();
      }
    }, yepnope.errorTimeout );
  }

  function load ( resource, type, dontExec ) {

    var elem  = ( type == 'c' ? strCssElem : strJsElem );
    
    // If this method gets hit multiple times, we should flag
    // that the execution of other threads should halt.
    started = 0;
    
    // We'll do 'j' for js and 'c' for css, yay for unreadable minification tactics
    type = type || 'j';
    if ( isString( resource ) ) {
      // if the resource passed in here is a string, preload the file
      preloadFile( elem, resource, type, this.i++, docElement, dontExec );
    } else {
      // Otherwise it's a resource object and we can splice it into the app at the current location
      execStack.splice( this.i++, 0, resource );
      execStack.length == 1 && executeStack();
    }

    // OMG is this jQueries? For chaining...
    return this;
  }

  // return the yepnope object with a fresh loader attached
  function getYepnope () {
    var y = yepnope;
    y.loader = {
      load: load,
      i : 0
    };
    return y;
  }

  /* End loader helper functions */
    // Yepnope Function
  yepnope = function ( needs ) {

    var i,
        need,
        // start the chain as a plain instance
        chain = this.yepnope.loader;

    function satisfyPrefixes ( url ) {
      // split all prefixes out
      var parts   = url.split( '!' ),
      gLen    = globalFilters.length,
      origUrl = parts.pop(),
      pLen    = parts.length,
      res     = {
        url      : origUrl,
        // keep this one static for callback variable consistency
        origUrl  : origUrl,
        prefixes : parts
      },
      mFunc,
      j;

      // loop through prefixes
      // if there are none, this automatically gets skipped
      for ( j = 0; j < pLen; j++ ) {
        mFunc = prefixes[ parts[ j ] ];
        if ( mFunc ) {
          res = mFunc( res );
        }
      }

      // Go through our global filters
      for ( j = 0; j < gLen; j++ ) {
        res = globalFilters[ j ]( res );
      }

      // return the final url
      return res;
    }

    function loadScriptOrStyle ( input, callback, chain, index, testResult ) {
      // run through our set of prefixes
      var resource     = satisfyPrefixes( input ),
          autoCallback = resource.autoCallback;

      // if no object is returned or the url is empty/0 just exit the load
      if ( resource.bypass ) {
        return;
      }

      // Determine callback, if any
      if ( callback ) {
        callback = isFunction( callback ) ? callback : callback[ input ] || callback[ index ] || callback[ ( input.split( '/' ).pop().split( '?' )[ 0 ] ) ];
      }

      // if someone is overriding all normal functionality
      if ( resource.instead ) {
        return resource.instead( input, callback, chain, index, testResult );
      }
      else {

        chain.load( resource.url, ( ( resource.forceCSS || ( ! resource.forceJS && /css$/.test( resource.url ) ) ) ) ? 'c' : undef, resource.noexec );

        // If we have a callback, we'll start the chain over
        if ( isFunction( callback ) || isFunction( autoCallback ) ) {
          // Call getJS with our current stack of things
          chain.load( function () {
            // Hijack yepnope and restart index counter
            getYepnope();
            // Call our callbacks with this set of data
            callback && callback( resource.origUrl, testResult, index );
            autoCallback && autoCallback( resource.origUrl, testResult, index );
          } );
        }
      }
    }

    function loadFromTestObject ( testObject, chain ) {
        var testResult = !! testObject.test,
            group      = testResult ? testObject.yep : testObject.nope,
            always     = testObject.load || testObject.both,
            callback   = testObject.callback,
            callbackKey;

        // Reusable function for dealing with the different input types
        // NOTE:: relies on closures to keep 'chain' up to date, a bit confusing, but
        // much smaller than the functional equivalent in this case.
        function handleGroup ( needGroup ) {
          // If it's a string
          if ( isString( needGroup ) ) {
            // Just load the script of style
            loadScriptOrStyle( needGroup, callback, chain, 0, testResult );
          }
          // See if we have an object. Doesn't matter if it's an array or a key/val hash
          // Note:: order cannot be guaranteed on an key value object with multiple elements
          // since the for-in does not preserve order. Arrays _should_ go in order though.
          else if ( isObject( needGroup ) ) {
            for ( callbackKey in needGroup ) {
              // Safari 2 does not have hasOwnProperty, but not worth the bytes for a shim
              // patch if needed. Kangax has a nice shim for it. Or just remove the check
              // and promise not to extend the object prototype.
              if ( needGroup.hasOwnProperty( callbackKey ) ) {
                loadScriptOrStyle( needGroup[ callbackKey ], callback, chain, callbackKey, testResult );
              }
            }
          }
        }

        // figure out what this group should do
        handleGroup( group );

        // Run our loader on the load/both group too
        handleGroup( always );

        // Fire complete callback
        if ( testObject.complete ) {
          chain.load( testObject.complete );
        }

    }

    // Someone just decides to load a single script or css file as a string
    if ( isString( needs ) ) {
      loadScriptOrStyle( needs, 0, chain, 0 );
    }
    // Normal case is likely an array of different types of loading options
    else if ( isArray( needs ) ) {
      // go through the list of needs
      for( i = 0; i < needs.length; i++ ) {
        need = needs[ i ];

        // if it's a string, just load it
        if ( isString( need ) ) {
          loadScriptOrStyle( need, 0, chain, 0 );
        }
        // if it's an array, call our function recursively
        else if ( isArray( need ) ) {
          yepnope( need );
        }
        // if it's an object, use our modernizr logic to win
        else if ( isObject( need ) ) {
          loadFromTestObject( need, chain );
        }
      }
    }
    // Allow a single object to be passed in
    else if ( isObject( needs ) ) {
      loadFromTestObject( needs, chain );
    }
  };

  // This publicly exposed function is for allowing
  // you to add functionality based on prefixes on the
  // string files you add. 'css!' is a builtin prefix
  //
  // The arguments are the prefix (not including the !) as a string
  // and
  // A callback function. This function is passed a resource object
  // that can be manipulated and then returned. (like middleware. har.)
  //
  // Examples of this can be seen in the officially supported ie prefix
  yepnope.addPrefix = function ( prefix, callback ) {
    prefixes[ prefix ] = callback;
  };

  // A filter is a global function that every resource
  // object that passes through yepnope will see. You can
  // of course conditionally choose to modify the resource objects
  // or just pass them along. The filter function takes the resource
  // object and is expected to return one.
  //
  // The best example of a filter is the 'autoprotocol' officially
  // supported filter
  yepnope.addFilter = function ( filter ) {
    globalFilters.push( filter );
  };

  // Default error timeout to 10sec - modify to alter
  yepnope.errorTimeout = 1e4;

  // Webreflection readystate hack
  // safe for jQuery 1.4+ ( i.e. don't use yepnope with jQuery 1.3.2 )
  // if the readyState is null and we have a listener
  if ( doc.readyState == null && doc.addEventListener ) {
    // set the ready state to loading
    doc.readyState = 'loading';
    // call the listener
    doc.addEventListener( 'DOMContentLoaded', handler = function () {
      // Remove the listener
      doc.removeEventListener( 'DOMContentLoaded', handler, 0 );
      // Set it to ready
      doc.readyState = 'complete';
    }, 0 );
  }

  // Attach loader &
  // Leak it
  window.yepnope = getYepnope();

} )( this, this.document );

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
	@ version 2.0.1

	@ requires yepnope-1.0.2+ (or Modernizr 2 w/ Modernizr.load)
*/


/**
		Global Static f0xy Class with static methods.
		@static
		@class
*/ 

/** @namespace */
var f0xy = (function(){

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

		if(identifier != '' && typeof identifier !== "object") {
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
		else if(typeof identifier === "object"){ns = identifier;}

		if(classes !== false){
			
			for(var className in classes){
				if(classes[className].superClassIdentifier){
					if(!classes.require){classes.require = [];}
					classes.require.push(classes[className].superClassIdentifier);
					if(_extendQueue.indexOf(identifier + _separator + className) === -1){
						_extendQueue.push(identifier + _separator + className);
					}
				}
			}

			if("require" in classes && classes.require.length > 0){
				
				for(var className in classes){

					if(className !== "require"){

						var addTo = (_f0xy.isClass(classes[className])) ? classes[className].prototype : classes[className];
						
						addTo.dependencies = classes.require;
						addTo.nsID = identifier;
						addTo.ns = ns;
						addTo.className = className;

						ns[className] = classes[className];
					}
				}

				_f0xy.require(classes.require);
			}
		}

		return ns;
	}	

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
		
		identifier = _f0xy.namespace(identifier, false);
		
		if(typeof identifier === "object" || typeof identifier === "function"){
			return identifier.isClass;
		}

		return false;
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

		if(typeof(identifiers) !== 'object' && !identifiers.sort){
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
		if(typeof(classes) !== 'object' && !classes.sort){
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

		if(typeof classes === "string"){classes = [classes];}
		
		var classFiles = [];
		
		for(var i = 0; i < classes.length; i ++){
			var identifier = classes[i];

			if((_loadedClasses.indexOf(identifier) === -1) && !_f0xy.isClass(identifier)){	
				_loadedClasses.push(identifier);
				classFiles.push(_f0xy.toURL(identifier));
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
						
						var packageObj = _f0xy.get(namespace, false);
						
						if(typeof packageObj[className].superClassIdentifier !== "undefined"){
							var superClass = _f0xy.get(packageObj[className].superClassIdentifier, false);
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
							
							if(!_f0xy.isClass(_loadQueues[i].classes[j])){
								dependenciesLoaded = false;
								break;
							}

							var obj = _f0xy.get(_loadQueues[i].classes[j], false);
							
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

	/**
	* The f0xy Base Class
	* Simple JavaScript Inheritance
	*
	* Taken from: http://ejohn.org/blog/simple-javascript-inheritance/
	* MIT Licensed.
	*
	* @class
	* @private
	*/ 

	// ## f0xy Base Class.
	// f0xy.Class is the ONLY Class to extend this directly, do not directly extend this Class.
	_f0xy.$$__BaseClass__$$ = (function(doInitialize){
		
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
						f0xy.unuse();
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
	})();	

	return _f0xy;

})();

f0xy.define("f0xy", {

	/** @lends f0xy.Class#*/

	Class : f0xy.extend("f0xy.$$__BaseClass__$$", {

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