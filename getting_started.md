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


## Class Goodies:

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
	
	
## Using Your Classes


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