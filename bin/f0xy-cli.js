var argv = require('../../lib/node-optimist').argv;

f0xy = require('../f0xy.js');

f0xy.configure({
	rootPath : __dirname + "/classes"
});


f0xy.require("com.f0xy.test.Test2", function(){
	var Test = f0xy.get("com.f0xy.test.Test2");

	var testInstance = new Test();
	console.log(this.com);
	console.log(f0xy.getLoadedFiles());
});