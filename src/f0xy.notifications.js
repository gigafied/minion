f0xy.define("f0xy", {

	/** @lends f0xy.NotificationManager# */ 

	NotificationManager : f0xy.extend("f0xy.Class", {

		_pendingNotifications: [],
		_interests: {},
		
		init : function(){
			
		},
		
		addInterest : function(obj, name, priority){
			if(typeof this._interests[name] === "undefined"){
				this._interests[name] = [];
			}
			if(priority <= -1 || typeof this._interests[name] !== undefined && priority >= this._interests[name].length){
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
					var priority = (names[i]['priority'] != null && names[i]['priority'] != undefined) ? names[i]['priority'] : 0;
					this.addInterest(obj, names[i]['name'], priority);
				}
			}
		},
		
		removeInterest : function(obj, name){
			
			var objIndex = this._interests[name].indexOf(obj);
			if(objIndex > -1){			
				this._interests[name].splice(objIndex, 1);
				if(this._notificationStatuses[name] === "pending" && objIndex >= this._notificationPointers[name]){
					this._notificationPointers[name] --;
				}
			}
		},
		
		removeInterests : function(obj, names){
			for(var i = 0; i < names.length; i++){
				this.removeInterest(obj, names[i]);
			}		
		},
		
		removeAllInterests : function(obj, name){
			if(obj != null){
				for(var i in this._interests){
					this.removeInterest(obj, i);
				}
			}
			else if(name != null){
				this._interests[name] = null;
			}		
		},
		
		notify : function(notification){
			notification.status = "pending";
			if(this._interests[notification.name] != null){
				this._pendingNotifications.push(notification);
				this._notifyObjects(notification);			
			}
		},
		
		_notifyObjects : function(notification){

			var name = notification.name;

			while(notification.pointer < this._interests[name].length){
				if(notification.status === "pending"){
					if(this._interests[name][notification.pointer].handleNotification != null){
						this._interests[name][notification.pointer].handleNotification(notification);
					}
					else{
						//throw new Error("handleNotification method not found on " + namesList[name][notificationPointers[name]]);
					}
					notification.pointer ++;
				}
				else{
					break;
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
				return new f0xy.Notification(name, data);
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
				notification.status = "pending"
				this._notifyObjects(notification);
			}
		},
		
		cancelNotification : function(name){
			var notification = this.getNotification(name);
			if(notification){
				this._pendingNotifications.splice(this._pendingNotifications.indexOf(notification), 1);
				notification.status = "";
			}
		}

	})

});

f0xy.enableNotifications();

f0xy.define("f0xy", {

	/** @lends f0xy.Notification# */ 

	Notification : f0xy.extend("f0xy.Class", {

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
			f0xy.holdNotification(this.name);
		},

		release : function(){
			f0xy.releaseNotification(this.name);
		},

		cancel : function(){
			f0xy.cancelNotification(this.name);
		},

		dispatch: function(obj){
			this.dispatcher = obj;
			f0xy.notify(this);
		}
	})
});