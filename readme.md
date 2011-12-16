## MinionJS - Cross-Platform & Cross-Browser JavaScript Classical Inheritance

The goal of Minion is to provide easy-to-use, easy-to-learn classical inheritance for JavaScript.

Minion enables you to easily namespace, create and extend custom classes.

Minion handles all the nitty-gritty, so you can focus on the important stuff, like ironing out the final details of your plan for global domination.

####Features:

- Classical Inheritance in JavaScript
- Dependency management
- Singleton classes
- Static classes, methods and properties
- Intuitive publish/subscribe model
- this.__super() method support 
- Build tool for easy deployment (for browser-based applications)

Minion is a micro-framework. Which means, Minion does all this, all while sporting a tiny footprint of 3.9k (minified and gzipped).

#### Currently Supported:

- Node.js
- IE7+
- Safari 3+
- Opera 9.0+ 
- Chrome
- (Other browsers/platforms probably work, but have not been thoroughly tested).

####Some other cool little factoids:

- Fully ECMAScript 5 Strict Mode compliant.
- Passes JSHint with flying colors (with Assume : Browser, NodeJS).
- See no evil, do no evil. Zero use of eval, with and Function();
- Tests, tests, tests. You can be sure it works.
- Very well documented, lots o' comments.
- Minion does not touch native JavaScript prototypes. I.E. no Object.prototype.someSuperAwesomeMethod___weThink();
- Damage Control. No global pollution. All classes reside under the minion namespace. This is good, trust us.

## Installation

Grab the latest version of node [here](http://nodejs.org/)

Since Node.js now comes bundled with [npm](http://github.com/isaacs/npm), you no longer have to install it separately.

Once you have Node.js installed, just do:

	npm install minion-js

Or you can just clone this project via git:

	git clone git://github.com/gigafied/minion.git

## Getting Started

http://gigafied.github.com/minion/

## Documentation

JSDocs available at: http://gigafied.github.com/minion/docs/

## Examples

TODO

## Contributing

We want you to contribute. Fork the project, issue a pull request. Ideally, if you are adressing a specific issue, please create an issue in GitHub and reference that issue in your commits.
Write a Unit Test for your fix, so that we can be sure any future updates don't undo all your hard work :)

We'd love to support more platforms. There is very, very little platform detection in minion's source code. (This is a good thing, we want to keep it this way).
Getting it to work on other platforms should be relatively simple, so feel free to lend a hand!

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