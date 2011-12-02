f0xy.define("f0xy", {

	/** @lends f0xy.Class# */ 

	Class : f0xy.extend("f0xy.__BaseClass__", {

		__isDefined: true,
		__interestHandlers: [],

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
				f0xy.use(this.dependencies);
			}
		},

		unuse_dependencies : function(){
			f0xy.unuse();
		},
		
		/** 
		* Local version of window.setTimeout that keeps scope of <i>this</i>.<br>
		* 
		* @returns {Number}		 A timeout ID
		*/
		setTimeout : function(func, delay){
			return setTimeout(this.proxy(func), delay);
		},

		/** 
		* Local version of window.setInterval that keeps scope of <i>this</i>.<br>
		*
		* @returns {Number}		 An interval ID
		*/
		setInterval : function(func, delay){
			return setInterval(this.proxy(func), delay);
		},

		/** 
		* Shorthand for <i>func.bind(this)</i><br>
		* or rather, <i>$.proxy(func, this)</i> in jQuery terms
		*
		* @returns {Function}		 The proxied function
		*/
		proxy: function(func){
			return func.bind(this);
		},

		addInterest : function(name, handler, priority){
			if(handler){
				f0xy.addInterest(this, name, priority);
				this.__interestHandlers[name] = handler;
			}
		},

		removeInterest : function(name){
			if(this.__interestHandlers[name]){
				this.__interestHandlers[name] = null;
				delete this.__interestHandlers[name];
			}
			f0xy.removeInterest(this, name);
		},

		removeInterests : function(names){
			for(var i = 0; i < names.length; i ++){
				this.removeInterest(names[i]);
			}
		},

		removeAllInterests : function(){
			f0xy.removeAllInterests(this);
			this.__interestHandlers = [];
		},

		notify : function(name, data){
			var notification = new f0xy.Notification(name, data);
			notification.dispatch(this);
		},
		
		/** @ignore */
		handleNotification : function(n){
			var handler = this.__interestHandlers[n.name];
			if(handler){
				this.proxy(handler)(n);
			}
		}
	})
});