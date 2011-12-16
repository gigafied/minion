(function(){

	var minion = require('./minion.js');

	minion.define("minion", {
		
		Client : minion.extend("minion.Singleton", {

			_args : {},

			setArgs : function (args){
				this._args = args;
			},
			
			build : function () {

				var path, outputPath;

				path = this._parsePath(this._args.p, process.cwd());
				outputPath = this._parsePath(this._args.o, null);

				var c = this._args._[1];

				minion.configure({
					rootPath : path
				});

				minion.require(c, this.proxy(function(Class){

					var files = minion.getLoadedFiles();

					var output = this._args.i ? this._compress("./minion.js") : "";

					for(var i = 0; i < files.length; i ++){
						var file = files[i];
						
						if(file.indexOf("minion.Client.js") < 0){
							output += this._compress(files[i]);
						}
					}

					if(outputPath){
						var fs = require("fs");						
						fs.writeFile(outputPath, output);	
					}
					else{
						console.log("");
						console.log("-----------------------------------START OUTPUT-----------------------------------");
						console.log("");
						console.log(output);
						console.log("");
						console.log("------------------------------------END OUTPUT------------------------------------");
						console.log("");
					}

				}));
			},

			_compress : function (file) {
				
				var fs = require('fs');
				var uglify = require('uglify-js').uglify;
				var parser = require('uglify-js').parser;

				var code = fs.readFileSync(file, 'utf-8');

				code = parser.parse(code);
				code = uglify.ast_mangle(code);
				code = uglify.ast_squeeze(code);
				code = uglify.gen_code(code);

				return code;				
			},

			_parsePath : function (path, fallbackValue) {
				if(!path){return fallbackValue};
				return path[0] === "/" ? path : process.cwd() + "/" + path;
			}

		})

	});

})();