## MinionJS - Getting Started

## Installation

While you don't actually need to install MinionJS to use it, it's recommended, especially if you are developing for a browser-based application. MinionJS provides a very nifty build tool, that you will want to take advantage of.

Grab the latest version of Node.js [here](http://nodejs.org/)

Since Node.js now comes bundled with [npm](http://github.com/isaacs/npm), you no longer have to install it separately.

Once you have Node.js installed, just do:

	npm install minion-js

Or you can just clone this project via git:

	git clone git://github.com/gigafied/minion.git
	sudo npm link

If you're gonna be developing inside Node.js, put this at the top of all your .js files:

	var minion = require("minion-js");

If you're gonna be developing via the browser, copy <code>./dist/minion.1.4.1.js</code> to a place of your choosing and include it via a  &lt;script&gt; tag.

If you just want to start playing around without installing anything grab the source [here](https://github.com/gigafied/minion/blob/master/dist/minion.1.4.1.js)
(Yep, you only need one lousy .js file!)


## Defining a Class

To define a new Class create a new JS file, with the following syntax:

	minion.define("com.example", {

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

Save this file to: <code>path/to/your/js/com/example/Example.js</code>

What the above code does is declare a new class called <code>Example</code> under the <code>com.example</code> namespace, that extends <code>minion.Class</code> (the Minion base class).

The first argument of <code>minion.define()</code> is a namespace identifier. The second argument is an Object, and while it is an Object, you only define one Class per define call. We use Object syntax, so you can easily declare the name of your Class.

<code>init()</code> is the Constructor for all classes, it acts like a normal function, it can accept any number of arguments.


## Class Goodies

#### Dependencies

You can optionally specify a <code>require</code> array before your Class defintion, like this:

	minion.define("com.example", {

		require : [
			"com.example.Dependency1",
			"com.example.Dependency2"
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
	
By doing this, you tell Minion that <code>com.example.Example</code> has two dependencies and to make sure those dependencies are loaded and defined before <code>com.example.Example</code> is defined.

If you specify dependencies, Minion store's references to those dependencies under <code>this.__imports</code>

This means you can do things like this:


	minion.define("com.example", {

		require : [
			"com.example.Dependency1",
			"com.example.Dependency2"
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


	minion.define("com.example", {

		Example2 : minion.extend("com.example.Example", {


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

	minion.define("com.example", {

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


## Using Your Classes

To start using your classes, you'll need to call two methods, <code>minion.configure()</code> and <code>minion.require()</code>:


	minion.configure({
		classPath : "path/to/your/js"
	});

	minion.require("com.example.Example", function(Example){

		var instance = new Example();

		instance.doSomething();

	})


<code>minion.configure()</code> takes a configuration Object, you can pass a few more things than <code>classPath</code> but we'll talk more about that later.

<code>classPath</code> is relative to where you currently are. I.e. if you're calling it from an HTML page (or a js file that gets loaded in via a HTML page), it is relative to that HTML page. If you're calling it from node, it's relative to where your .js file is running from.

<code>minion.require()</code> takes two arguments. The first is the fully qualified class name(s) of the class(es) you want to use. This can be a string, or an array. The second argument is a callback function. This function gets called once the classes specified in the first argument (and their dependencies) have been loaded and defined.

The callback function takes x number of arguments, where x = the number of classes you pass in the first argument. It provides an easy way to reference your classes. Any callback function argument specified will match up to the index of the array you provide in the first argument.


## Packaging Your Classes Up

If you are working inside Node.js this is unneccessary, however for browser-based development, you are going to need to combine all your classes into a nice neat little minified js file (or a couple minified js files).

This is where the build tool comes in:

	minion build com.example.Example -p /path/to/your/js -o /path/to/your/js/output.min.js -i

It's that easy! What this does is compile all your classes into one neat little minified js file (using UglifyJS for compression).

<code>-p</code> The path to your class definitions.
<code>-o</code> This specifies the file you want MinionJS to write the minified contents to.
<code>-i</code> Whether or not to include MinionJS in the minified js file. Don't pass this if you want to include Minion separately

The build tool is a major focus right now, soon we will have an option to run it with a config.json, making it easier on you :)

## WOOT!!! 

If you've made it here, you should now have a pretty solid understanding of MinionJS and how to use it. We also threw some [JSDocs](http://gigafied.github.com/minion/docs/) together, if you want to dive in even deeper.

## Documentation

JSDocs available at: http://gigafied.github.com/minion/docs/

## License

	(c) 2011 Taka Kojima (the "Author").
	All Rights Reserved.

	Permission is hereby granted, free of charge, to any person
	obtaining a copy of this software and associated documentation
	files (the "Software"), to deal in the Software without
	restriction, including without limitation the rights to use,
	copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following
	conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	Distributions of all or part of the Software intended to be used
	by the recipients as they would use the unmodified Software,
	containing modifications that substantially alter, remove, or
	disable functionality of the Software, outside of the documented
	configuration mechanisms provided by the Software, shall be
	modified such that the Author's bug reporting email addresses and
	urls are either replaced with the contact information of the
	parties responsible for the changes, or removed entirely.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
	OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.

	Except where noted, this license applies to any and all software
	programs and associated documentation files created by the
	Author, when distributed with the Software.