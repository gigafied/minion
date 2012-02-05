var fs = require("fs");
var path = require("path");

var minion = require("../lib/minion.js");

minion.define("minion", {
	
	Interface : minion.extend("minion.Singleton", {

		_args : {},

		setArgs : function (args){
			this._args = args;
		},
		
		build : function () {
			/*
			-p The path to your class definitions.
			-o This specifies the file you want MinionJS to write the minified contents to.
			-w Run in watch mode, will rebuild everytime a file in the build tree is modified.
			-i Whether or not to include MinionJS in the minified js file.
			-c Configuration File. You can use a Config File to specify options for your build, this is the preferred method.
			*/

			if(this._args.w){
				this.watch();
				return;
			}

			if(this._args.c) {
				minion.build(this._args.c, null, true);
			}
			else{
				var opts = {};
				opts.class_path - this._args.p;
				opts.output = this._args.o;
				opts.include_minion = this._args.i;
				minion.build(opts, null, true);
			}
		},

		watch : function () {
			console.dir(this._args);
			if(this._args.c) {
				minion.watch(this._args.c, null, true);
			}
			else{
				var opts = {};
				opts.class_path - this._args.p;
				opts.output = this._args.o;
				opts.include_minion = this._args.i;
				minion.watch(opts, null, true);
			}
		},

		// Outputs the browser version of the source to the path specified i.e. `minion src minion.js` will write a file to cwd/minion.js
		src : function () {
			var output = path.normalize(process.cwd() + "/" + this._args._[1]);
			fs.writeFileSync(output, fs.readFileSync(path.normalize(__dirname + "/../dist/minion-latest.js"), 'utf-8'));
			
		},

		// Outputs the minified source to the path specified i.e. `minion min minion.min.js` will write a file to cwd/minion.min.js
		min : function () {
			var output = path.normalize(process.cwd() + "/" + this._args._[1]);
			fs.writeFileSync(output, fs.readFileSync(path.normalize(__dirname + "/../dist/minion-latest.min.js"), 'utf-8'));			
		}
	})
});

module.exports = minion.get("minion.Interface");