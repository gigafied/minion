## MinionJS - Getting Started

## Installation

While you don't actually need to install MinionJS to use it, it's recommended, especially if you are developing for a browser-based application. MinionJS provides a very nifty build tool, that you will want to take advantage of.

Grab the latest version of Node.js [here](http://nodejs.org/)

Since Node.js now comes bundled with [npm](http://github.com/isaacs/npm), you no longer have to install it separately.

Once you have Node.js installed, <code>cd</code> into the directory where you want to install MinionJS and do:

	npm install minion
	
This will install minion locally at <code>node_modules/minion</code>.

You can also just clone this project via git:

	git clone git://github.com/gigafied/minion.git
	git submodule init
	git submodule update
	make
	sudo npm link

If you're gonna be developing inside Node.js, put this at the top of all your .js files that will be using MinionJS:

	var minion = require("minion");

If you're gonna be developing via the browser, copy <code>./dist/minion.1.4.1.js</code> to a place of your choosing and include it via a  &lt;script&gt; tag.

If you just want to start playing around without installing anything grab the source [here](https://github.com/gigafied/minion/blob/master/dist/minion.1.4.1.js)
(Yep, you only need one lousy .js file!)


## Defining a Class

To define a new Class create a new JS file, with the following syntax:

	minion.define("example", {

		Example : minion.extend("minion.Class", {

			exampleVar1: 1,
			exampleVar2: 2,

			init: function(){

			},

			doSomething : function(something){
				//do something with something
			}
		})
		
	});

Save this file to: <code>path/to/your/js/example/Example.js</code>

What the above code does is declare a new class called <code>Example</code> under the <code>example</code> namespace, that extends <code>minion.Class</code> (the MinionJS base class).

The first argument of <code>minion.define()</code> is a namespace identifier. The second argument is an Object, and while it is an Object, you only define one Class per define call. We use Object syntax, so you can easily declare the name of your Class.

<code>init()</code> is the Constructor for all classes, it acts like a normal function, it can accept any number of arguments.


## Class Goodies

#### Dependencies

You can optionally specify a <code>require</code> array before your Class defintion, like this:

	minion.define("example", {

		require : [
			"example.Dependency1",
			"example.Dependency2"
		],

		Example : minion.extend("minion.Class", {

			exampleVar1: 1,
			exampleVar2: 2,

			init: function(){

			},

			doSomething : function(something){
				//do something with something
			}
		})
		
	});
	
By doing this, you tell MinionJS that <code>example.Example</code> has two dependencies and to make sure those dependencies are loaded and defined before <code>example.Example</code> is defined.

If you specify dependencies, MinionJS store's references to those dependencies under <code>this.__imports</code>

This means you can do things like this:


	minion.define("example", {

		require : [
			"example.Dependency1",
			"example.Dependency2"
		],

		Example : minion.extend("minion.Class", {

			someInstance: null,
			someOtherInstance: null,

			init: function(){
				
				this.someInstance = new this.__imports.Dependency1();
				this.someOtherInstance = new this.__imports.Dependency2();
			}

		})
		
	});
	

####Extending your own classes

Of course, you can extend your own classes as well, as long as somewhere up the chain, a class extends one of Minion's base Classes (<code>minion.Class</code>, <code>minion.Singleton</code> or <code>minion.Static</code>)


	minion.define("example", {

		Example2 : minion.extend("example.Example", {


			init: function(){

				this.__super();

			},


			doSomething : function(something){
				this.__super(something);
			}

		})
		
	});
	
	
You'll notice some calls to to <code>this.\_\_super()</code>. <code>this.\_\_super()</code> references the parent class' method, by the same name, and yes you can pass arguments.


####Static Properties & Methods

You can implement static methods and properties on Classes, by specifying all static properties and methods inside a <code>\_\_static</code> property, like this:

	minion.define("example", {

		Example : minion.extend("minion.Class", {

			__static : {
				
				someStaticMethod : function(){
					
				},

				someStaticProperty : "I am static";

			},

			init : function(){
				
			}

		})
		
	});
	
You will then be able to access these methods and properties with <code>Example.someStaticMethod()</code> and <code>Example.someStaticProperty</code>

NOTE: Static methods are not extendable. I.e. you can not call <code>this.\_\_super</code> from within a static method.


####Static Classes

If you want to create a completely static class, simply extend <code>minion.Static</code> instead of <code>minion.Class</code>

NOTE: Methods on static classes have no concept of <code>this.\_\_super()</code>


####Singleton Classes

You can implement Singleton's by extending <code>minion.Singleton</code> instead of <code>minion.Class</code>

Singleton's will not throw an error if you try to instantiate them more than once, they will just return the original instance.

Singleton's also have a static <code>.getInstance()</code> method that you can call at any time, even if the Class has not yet been instantiated anywhere. It will create a new instance and return that, or return an already existing instance.


####Other Goodies

- <code>this.proxy(fn)</code>. Binds the <code>fn</code> function to the scope of <code>this</code>.
- <code>this.setTimeout(fn, delay)</code>. Automatically calls <code>this.proxy(fn)</code> for you on the <code>fn</code> argument.
- <code>this.setInterval(fn, delay)</code>. Automatically calls <code>this.proxy(fn)</code> for you on the <code>fn</code> argument.

## Using Your Classes

To start using your classes, you'll need to call two methods, <code>minion.configure()</code> and <code>minion.require()</code>:


	minion.configure({
		classPath : "path/to/your/js"
	});

	minion.require("example.Example", function(Example){

		var instance = new Example();

		instance.doSomething();

	})


<code>minion.configure()</code> takes a configuration Object, you can pass a few more things than <code>classPath</code> but we'll talk more about that later.

<code>classPath</code> is relative to where you currently are. I.e. if you're calling it from an HTML page (or a js file that gets loaded in via a HTML page), it is relative to that HTML page. If you're calling it from node, it's relative to where your .js file is running from.

<code>minion.require()</code> takes two arguments. The first is the fully qualified class name(s) of the class(es) you want to use. This can be a string, or an array. The second argument is a callback function. This function gets called once the classes specified in the first argument (and their dependencies) have been loaded and defined.

The callback function takes x number of arguments, where x = the number of classes you pass in the first argument. It provides an easy way to reference your classes. Any callback function argument specified will match up to the index of the array you provide in the first argument.


## Publish/Subscribe

MinionJS implements a simple, yet robust pub/sub model.

#### Subscribe

All Classes have a <code>subscribe()</code> method. To subscribe to things, do this:


	minion.define("example", {

		SubscribeExample : minion.extend("minion.Class", {

			init: function(){

				this.subscribe("something", this._handleSomething);

			},

			_handleSomething : function (n) {
				console.log(n.data.someProperty);
			}

		})
		
	});

<code>subscribe()</code> takes three arguments. The first two are mandatory, the other is optional. The first, a String, for the notification you want to listen for. The second, a function that handles the notification.

The third argument <code>subscribe</code> accepts is <code>priority</code>. By default <code>subscribe</code> will add an instance to the end of a notification list. However, by passing in a value for <code>priority</code>, we can change this behavior.

For example:

		this.subscribe("something", this._handleSomething, 0);
		
This will make it so that <code>this</code> receives the Notification before all other already subscribed instances. 

Classes also have two related methods <code>unsubscribe()</code> and <code>unsubscribeAll()</code>. <code>unsubscribe()</code> takes one argument, the name of the notification you are unsubscribing. <code>unsubscribeAll()</code> takes no arguments, it removes all subscriptions.


#### Publish

All Classes also have a <code>publish</code> method. To publish things, do this:

	minion.define("example", {

		PublishExample : minion.extend("minion.Class", {

			init: function(){

				this.doSomething("something");

			},

			doSomething : function (someValue){
				this.publish("something", {someProperty : someValue})
			}

		})
		
	});
	
<code>publish()</code> takes two arguments. The first is a String, representing the name of the Notification you are sending. The second is an Object, representing data you are passing along with the Notification.


#### Notifications

Notifications are similar to events, except events bubble and usually follow heirarchy. I.e child or sibling objects don't receive events fired by their parents or siblings.

Notifications don't bubble, you can subscribe and publish notifications to and from anywhere. You also don't do <code>this.someChildInstance.subscribe()</code>, it's always <code>this.subscribe()</code>

Notification handler functions receive a <code>Notification</code> Object. <code>Notifications</code> have three properties:

- <code>data</code>. An Object of data that gets passed with the Notification.
- <code>name</code>. A String representing the name of the notification, in the above examples, this is "something".
- <code>dispatcher</code>. A reference to the Class instance that dispatched the notification.

Notifications also have these three methods:

- <code>hold</code>. Suspends any subsequent instances from receiving this Notification.
- <code>release</code>. Releases a Notification. Called some point after <code>hold()</code>.
- <code>cancel</code>. Cancels a Notification. Like <code>hold()</code>, but once cancelled Notifications can no longer be released.

<code>hold()</code> and <code>release()</code> are very powerful and can be used to accomplish some pretty nifty things.

Simple example of <code>hold()</code> and <code>release()</code>

			_handleSomething : function (n) {			
				console.log(n.data.something);
				
				n.hold();

				setTimeout(function(){
					n.release();
				}, 2000)

			}

Any instances other than <code>this</code> will still receive the Notification, however, <code>_handleSomething()</code> holds the Notification, and then releases it 2 seconds later.
I'll leave the rest up to your own devices.

Similarly, we can use <code>cancel()</code>:

			_handleSomething : function (n) {			
				console.log(n.data.something);			
				n.cancel();
			}


This will make it so that any other instances listening for this Notification, won't hear about it.

## Packaging Your Classes Up

If you are working inside Node.js this is unneccessary, however for browser-based development, you are going to need to combine all your classes into a nice neat little minified js file (or a couple minified js files) for deployment.

To install the build tool, cd into <code>node_modules/minion</code> and run:

	sudo npm link
	
What this does is create a symbolic link in your <code>/usr/local/bin</code> dir. Mapping <code>minion</code> to <code>node_modules/minion/bin/minion-cli.js</code>

This step is only necessary if you want a way to easily reference the build script.

Now, you can use the build script:

	minion build example.Example -p /path/to/your/js -o /path/to/your/js/output.min.js

If you opted out of the <code>sudo npm link</code> step, you can just do this instead:

	node_modules/minion/bin/minion-cli.js build example.Example -p /path/to/your/js -o /path/to/your/js/output.min.js

It's that easy! What this does is compile a class (and all of it's dependencies) into one neat little minified js file (using UglifyJS for compression).

- <code>-p</code> The path to your class definitions.
- <code>-o</code> This specifies the file you want MinionJS to write the minified contents to.
- <code>-w</code> Run in watch mode, will rebuild everytime a file in the build tree is modified.
- <code>-i</code> Whether or not to include MinionJS in the minified js file.
- <code>-c</code> Configuration File. You can use a Config File to specify options for your build, this is the preferred method.

#### Using a Config File

There is a sample config file included in the repo under <code>bin/sample.conf.json</code>. It builds the Classes in the <code>test</code> dir.

It looks like this:

    {
        "vars" : {
            "output_path" : "unit/classes",
            "class_path" : "../test/unit/classes"
        },

        "class_path" : "{{class_path}}",
        "output_path" : "{{output_path}}",
        "include_duplicates" : false,
        "jshint" : true,

        "jshint_options" : {
            "node" : true,
            "browser" : true
        },

        "build_groups" : [
            {
                "output" : "{{class_path}}/classes1.min.js",
                "classes" : [
                    "minion.test.Test2"
                ]
            },
            {
                "output" : "{{class_path}}/classes2.min.js",
                "classes" : [
                    "minion.*"
                ]
            }
        ]
    }
    
The <code>vars</code> property let's you specify variables that you can use throughout your config file. <code>vars</code> can use other <code>vars</code> in their value, as long as the <code>vars</code> they are using appear before them:

        "vars" : {
            "output_path" : "unit/classes",
            "class_path" : "../test/{{output_path}}"
        },

You use <code>vars</code> with the mustache syntax <code>{{var}}</code>.

<code>class_path</code> is the the path to your classes (relative to where the config file is).

<code>output_path</code> is what you want to prefix the <code>minion.configure({paths:...})</code> definitions with.

<code>include_duplicates</code> usually you want to leave this set to false, set this to true if you want to compile the same classes into multiple files.

<code>jshint</code> Whether or not to JSHINT your Classes before compiling.

<code>jshint_options</code> An object of the options you want to use for JSHINT checking.

<code>build_groups</code> Using a config file, you can specify multiple groupings of classes to build, all to separate minified files.

A build group has two mandatory properties:

- <code>output</code> The path where you want to write the minified file to (relative to the config file).
- <code>classes</code> An array of fully qualified names, representing the classes you want to include.

You don't have to explicitly list all Classes you want compiled in a build group. This is the beauty of MinionJS. MinionJS will also automatically include dependencies in the build group.

So, if <code>minion.test.Test2</code> extends <code>minion.test.Test1</code> and lists <code>minion.test.SomeDependency</code> as a dependency, then we only have to specify <code>minion.test.Test2</code> and MinionJS will automatically include <code>minion.test.Test1</code> and <code>minion.test.SomeDependency</code> in the build group for you.

You can also specify full namespaces under <code>classes</code>. In the example above, you'll see this:

               "classes" : [
                    "minion.*"
                ]

This includes any and all classes under the <code>minion</code> namespace. This will include any classes directy in the <code>minion</code> namespace and children namespaces, like <code>test</code>

However, in this example, we are already including <code>minion.test.Test2</code> in the prior build group, so it will be ommitted in this build group (along with all of it's dependencies) as it's already compiled elsewhere.

Build groups can also have the following optional properties:

- <code>class_path</code>
- <code>output_path</code>
- <code>include_duplicates</code>
- <code>jshint</code>
- <code>jshint_options</code>


By specifying any one of these properties, it will use that property over the corresponding parent property. They are completely optional, so you only have to specify them if you want specific behavior/options for a given build group.

####minion.provides()

<code>minion.provides()</code> provides you with a way to explicitly specify where Classes are defined.

For example:

	minion.provides("path/to/js/classes.min.js", [
		"example.Example",
		"example.Example2",
		"example.Example3"
	]);

	minion.provides("path/to/js/classes2.min.js", [
		"example.Example4",
		"example.Example5",
		"example.Example6"
	]);


This let's you group classes and dependencies into a single or multiple files for optimization. For instance, say you only need x, y and z class when the App starts up, but later on you require other Classes.

Rather than throwing all Classes into one minified file, you can separate them out, which means faster initial loading. You can then preload all other classes, or load them on an as-needed basis, the option is up to you.

Just make sure all <code>minion.provides()</code> calls happen before the first <code>minion.require()</code> call.

You can also pass paths to <code>minion.configure()</code> with the <code>paths</code> property, so intead of the above, you could do:

	minion.configure({paths: [
	    {
	        "file": "path/to/js/classes1.min.js",
	        "classes": [
					"example.Example",
					"example.Example2",
					"example.Example3"
	        ]
	    },
	    {
	        "file": "path/to/js/classes2.min.js",
	        "classes": [
					"example.Example4",
					"example.Example5",
					"example.Example6"
	        ]
	    }
	]});
	
This is the syntax the build script will output for you, that you can just copy and paste into your application.

## WOOT!!! 

If you've made it here, you should now have a pretty solid understanding of MinionJS and how to use it. We also threw some [JSDocs](http://gigafied.github.com/minion/docs/) together, if you want to dive in even deeper.

## Documentation

JSDocs available at: http://gigafied.github.com/minion/docs/