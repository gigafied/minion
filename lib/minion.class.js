(function() {
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Class# */ 

		Class : minion.extend("minion.__BaseClass__", {

			__static : {
				__isDefined: true
			},

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
				if(!this._interestHandlers) {
					this._interestHandlers = [];
				}

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

})();