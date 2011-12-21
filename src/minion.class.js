(function(){
	
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
			proxy: function(func){
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
					minion.addInterest(this, name, priority);
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
				minion.removeInterest(this, name);
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
			*/

			publish : function(name, data){
				minion.publish(name, data, this);
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

})();