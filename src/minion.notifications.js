(function(){
	
	"use strict";

	minion.define("minion", {

		NotificationManager : minion.extend("minion.Class", {

			_pendingNotifications: [],
			_interests: {},
			_removeQueue: [],
			
			init : function(){
				
			},
			
			addInterest : function(obj, name, priority){
				priority = (priority || priority === 0) ? priority : -1;
				if(typeof this._interests[name] === "undefined"){
					this._interests[name] = [];
				}
				if(priority <= -1 || priority >= this._interests[name].length){
					this._interests[name].push(obj);
				}
				else{
					this._interests[name].splice(priority, 0, obj);
				}
			},
			
			addInterests : function(obj, names){
				for(var i = 0; i < names.length; i++){
					if(typeof names[i] === "string"){
						this.addInterest(obj, names[i]);
					}
					else if(typeof names[i] === "object" || typeof names[i] === "array"){
						var priority = (names[i].priority !== null && names[i].priority !== undefined) ? names[i].priority : -1;
						this.addInterest(obj, names[i].name, priority);
					}
				}
			},
			
			removeInterest : function(obj, name){
				var objIndex = this._interests[name].indexOf(obj);
				if(obj && objIndex > -1){
					var pendingNotification = this.getNotification(name);
					if(pendingNotification){
						var rq = this._removeQueue[name] = this._removeQueue[name] || [];
						rq.push(obj);
					}
					else{
						this._interests[name].splice(objIndex, 1);
					}
				}
			},
			
			removeInterests : function(obj, names){
				for(var i = 0; i < names.length; i++){
					this.removeInterest(obj, names[i]);
				}		
			},
			
			removeAllInterests : function(obj, name){
				if(obj !== null){
					for(var i in this._interests){
						if(this._interests.hasOwnProperty[i]) {
							this.removeInterest(obj, i);
						}
					}
				}
				else if(name !== null){
					this._interests[name] = null;
				}		
			},
			
			notify : function(notification){
				notification.status = "pending";
				notification.pointer = 0;

				if(this._interests[notification.name] !== null){
					this._pendingNotifications.push(notification);
					this._notifyObjects(notification);
				}
			},
			
			_notifyObjects : function(notification){

				var name = notification.name;

				while(notification.pointer < this._interests[name].length){
					if(notification.status === "pending"){
						if(this._interests[name][notification.pointer].handleNotification !== null){
							this._interests[name][notification.pointer].handleNotification(notification);
						}
						notification.pointer ++;
					}
					else{
						return;
					}
				}

				if(notification.status === "pending"){
					this.cancelNotification(notification.name);
				}
			},

			getNotification : function(name, data){
				for(var i = 0; i < this._pendingNotifications.length; i ++){
					if(this._pendingNotifications[i].name === name){
						return this._pendingNotifications[i];
					}
				}
				if(data){
					return new minion.Notification(name, data);
				}
				return false;
			},
			
			holdNotification : function(name){
				var notification = this.getNotification(name);
				if(notification){
					notification.status = "hold";
				}
			},
			
			releaseNotification : function(name){
				var notification = this.getNotification(name);

				if(notification && notification.status === "hold"){
					notification.status = "pending";
					this._notifyObjects(notification);
				}
			},
			
			cancelNotification : function(name){
				var notification = this.getNotification(name);
				if(notification){
					this._pendingNotifications.splice(this._pendingNotifications.indexOf(notification), 1);

					notification.status = "";

					if(this._removeQueue[name]){
						for(var i = 0; i < this._removeQueue.length; i ++){
							this.removeInterest(this._removeQueue[name][i], name);
						}
						this._removeQueue[name] = null;
						delete this._removeQueue[name];
					}
				}
			}

		})

	});

	minion.define("minion", {

		Notification : minion.extend("minion.Class", {

			data: {},
			name: "",
			dispatcher: null,
			status: "",
			pointer: 0,

			init : function(name, data){
				this.name = name;
				this.data = data;
			},

			hold : function(){
				minion.holdNotification(this.name);
			},

			release : function(){
				minion.releaseNotification(this.name);
			},

			cancel : function(){
				minion.cancelNotification(this.name);
			},

			dispatch: function(obj){
				this.dispatcher = obj;
				minion.notify(this);
			}
		})
	});

	minion.enableNotifications();

})();