### MinionJS - Cross-Platform & Cross-Browser Classical Inheritance

MinionJS provides easy-to-use, easy-to-learn classical inheritance for JavaScript. Easily namespace, create and extend classes!

#### Defining a Class:

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


#### Using a Class:


	minion.require("example.Example", function(Example) {
	
	    var instance = new Example();
	    instance.doSomething();
	  
	})


That's the core of Minion, it's that simple. 

<br>


#### Getting Started

- [Documentation](https://github.com/gigafied/minion/blob/master/docs/getting_started.md)
- [Overview](http://www.screenr.com/wOas)
- [Publish/Subscribe](http://www.screenr.com/cJ5s)


<br>

####Features:

- Classical Inheritance in JavaScript
- Dependency management
- Singleton classes
- Static classes, methods and properties
- Intuitive publish/subscribe model
- this.__super() method support 
- Build tool for easy deployment (for browser-based applications)
- MinionJS does all this, all while sporting a tiny footprint of 3.8k (minified and gzipped).

<br>

####Currently Supported:

- Node.js
- IE 7+
- Safari 3+
- Opera 9+ 
- Chrome 9+
- iOS
- Android
- (Other browsers/platforms probably work, but have not been thoroughly tested).

<br>

####Some other cool little factoids:

- Fully ECMAScript 5 Strict Mode compliant.
- Passes [JSHint](http://www.jshint.com) with flying colors (with Assume : Browser, NodeJS).
- See no evil, do no evil. Zero use of eval, with and Function();
- Tests, tests, tests. You can be sure it works.
- Very well documented, lots o' comments.
- MinionJS does not touch native JavaScript prototypes. I.E. no Object.prototype.someSuperAwesomeMethod___weThink();
- Damage Control. No global pollution (by default). All classes reside under the minion namespace. This is good, trust us.

<br>
<br>

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