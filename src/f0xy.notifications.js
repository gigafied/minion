f0xy.define("f0xy", {

	/** @lends f0xy.NotificationManager# */ 

	NotificationManager : f0xy.extend("f0xy.Class", {

		_pendingNotifications: [],
		_namesList: {},
		
		init : function(){
			
		},
		
		addInterest : function(obj, name, priority){
			if(typeof this._namesList[name] === "undefined"){
				this._namesList[name] = [];
			}
			if(priority <= -1 || typeof this._namesList[name] !== undefined && priority >= this._namesList[name].length){
				this._namesList[name].push(obj);
			}
			else{
				this._namesList[name].splice(priority, 0, obj);
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
			
			var objIndex = this._namesList[name].indexOf(obj);
			if(objIndex > -1){			
				this._namesList[name].splice(objIndex, 1);
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
				for(var i in this._namesList){
					this.removeInterest(obj, i);
				}
			}
			else if(name != null){
				this._namesList[name] = null;
			}		
		},
		
		notify : function(notification){
			notification.status = "pending";
			
			if(this._namesList[notification.name] != null){
				_pendingNotifications.push(notification);
				this._notifyObjects(notification);			
			}
		},
		
		_notifyObjects : function(notification){

			var name = notification.name;

			while(notification.pointer < this._namesList[name].length){
				if(notification.status === "pending"){
					if(this._namesList[name][notification.pointer].handleNotification != null){
						this._namesList[name][notification.pointer].handleNotification(notification);
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
			cancelNotification(notification.name);
		},

		getNotification : function(name, data){
			for(var i = 0; i < _pendingNotifications.length; i ++){
				if(_pendingNotifications[i].name === name){
					return _pendingNotifications[i];
				}
			}
			if(data){
				return new f0xy.Notification(name, data);
			}
			return false;
		},
		
		holdNotification : function(name){
			var notification = getNotification(name);
			if(notification){
				notification.status = "hold"
			}
		},
		
		releaseNotification : function(name){
			var notification = getNotification(name);
			if(notification && notification.status === "hold"){
				notification.status = "pending"
				this._notifyObjects(notification);
			}
		},
		
		cancelNotification : function(name){
			var notification = getNotification(name);
			if(notification){
				_pendingNotifications.splice(_pendingNotifications.indexOf(notification), 1);
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


f0xy.define("f0xy", {

	/** @lends f0xy.Class# */ 

	Class : f0xy.extend("f0xy.$$__BaseClass__$$", {

		isClass: true,
		_interestHandlers: [],

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
		},

		addInterest : function(name, handler, priority){
			if(handler){
				f0xy.addInterest(this, name, priority);
				this._interestHandlers[name] = handler;
			}
		},

		removeInterest : function(name){
			if(this._interestHandlers[name]){
				this._interestHandlers[name] = null;
				delete this._interestHandlers[name];
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
			this._interestHandlers = [];
		},

		notify : function(name, data){
			var notification = new f0xy.Notification(name, data);
			notification.dispatch(this);			
		},

		holdNotification : function(name){
			f0xy.holdNotification(name);
		},

		releaseNotification : function(name){
			f0xy.releaseNotification(name);	
		},

		cancelNotification : function(name){
			f0xy.cancelNotification(name);			
		},

		handleNotification : function(n){
			var handler = this._interestHandlers[n.name];
			if(handler){
				handler(n);
			}
		}
	})
});