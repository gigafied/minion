(function(){
	
	"use strict";

	minion.define("minion", {

		/** @lends minion.Notification# */ 

		Notification : minion.extend("minion.Class", {

			data : {},
			name : "",
			dispatcher : null,
			status : 0, // 0 : Closed; 1 : Pending; 2 : Hold
			pointer : 0,

			/**
			*
			* Notifications are the backbone of Minion's pub/sub model.
			* You should not have to construct Notification's directly, as the publish() method does this for you.
			*
			* @constructs
			* @param		{String}				name			The name of the Notification.
			* @param		{Object}				data			An object of data associated with the Notification.		
			*/
			init : function(name, data) {
				this.name = name;
				this.data = data;
			},

			/**
			*
			* Holds a notification. Useful if you want to do other things before other instances receive this Notification,
			*
			* @public
			*/
			hold : function() {
				this.status = 2;
			},

			/**
			*
			* Releases a Notification, call this at some point after hold();
			*
			* @public
			*/

			release : function() {
				this.status = 1;
				minion.releaseNotification(this);
			},

			/**
			*
			* Cancels a Notification, any instances interested in this Notification higher up the chain will not receive it.
			*
			* @public
			*/

			cancel : function() {
				minion.cancelNotification(this);

				this.data = {};
				this.name = "";
				this.status = 0;
				this.pointer = 0;
				this.dispatcher = null;
			},

			/**
			*
			* Dispatches a Notification. You will rarely ever construct or call dispatch() on Notifications directly, as the publish() method handles all of this.
			*
			* @param		{Object}		obj		An Object referencing what is dispatching this Notification.
			* @public
			*/

			dispatch : function(obj) {
				this.status = 1;
				this.pointer = 0;
				this.dispatcher = obj;

				minion.publish(this);
			}
		})
	});


	minion.define("minion", {

		/*
			This Class handles all the nitty gritty Notification stuff.
			TODO: Be nice and add some comments for other people :)
		*/

		require : [
			"minion.Notification"
		],

		NotificationManager : minion.extend("minion.Singleton", {

			_pendingNotifications: [],
			_pendingNotificationNames : [],
			_interests: {},
			_removeQueue: [],
			
			subscribe : function(obj, name, priority) {
				
				priority = isNaN(priority) ? -1 : priority;
				this._interests[name] = this._interests[name] || [];

				if(priority <= -1 || priority >= this._interests[name].length){
					this._interests[name].push(obj);
				}
				else{
					this._interests[name].splice(priority, 0, obj);
				}
			},

			unsubscribe : function(obj, name){
				if(name instanceof Array){
					for(var i = 0; i < name.length; i ++){
						this.unsubscribe(obj, name[i]);
					}
					return;
				}
				var objIndex = this._interests[name].indexOf(obj);
				if(obj && objIndex > -1){

					if(this._pendingNotificationNames.indexOf(name) > -1) {
						var rq = this._removeQueue[name] = this._removeQueue[name] || [];
						rq.push(obj);
					}
					else{
						this._interests[name].splice(objIndex, 1);
					}
				}
			},
			
			publish : function(notification, data, obj){

				if(!(notification instanceof this.__imports.Notification)){
					notification = new this.__imports.Notification(notification, data);
					notification.dispatch(obj);
					return;
				}
				
				var name = notification.name;

				if(this._interests[name]){
					this._pendingNotifications.push(notification);
					this._pendingNotificationNames.push(name);
					this._notifyObjects(notification);
				}
			},
			
			_notifyObjects : function(notification){

				var name = notification.name;

				while(notification.pointer < this._interests[name].length) {
					if(notification.status === 1){
						if(this._interests[name][notification.pointer].handleNotification){
							this._interests[name][notification.pointer].handleNotification(notification);
						}
						notification.pointer ++;
					}
					else{
						return;
					}
				}

				if(notification.status === 1) {
					this.cancelNotification(notification);
				}
			},

			getNotification : function(name) {
				for(var i = 0; i < this._pendingNotifications.length; i ++){
					if(this._pendingNotifications[i].name === name){
						return this._pendingNotifications[i];
					}
				}
			},
						
			releaseNotification : function(notification){
				notification.status = 1;
				this._notifyObjects(notification);
			},
			
			cancelNotification : function(notification){
				if(notification){

					var name = notification.name;
					
					this._pendingNotifications.splice(this._pendingNotifications.indexOf(notification), 1);

					notification.status = 0;

					if(this._removeQueue[name]){
						for(var i = 0; i < this._removeQueue.length; i ++){
							this.unsubscribe(this._removeQueue[name][i], name);
						}
						this._removeQueue[name] = null;
						delete this._removeQueue[name];
					}

					notification = null;
				}
			}

		})

	});

	minion.enableNotifications();

})();