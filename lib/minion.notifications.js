(function(){
	
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