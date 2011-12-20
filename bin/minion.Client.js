(function(){

	var minion = require(__dirname + '/minion.js');
	var fs = require("fs");
	var color = require("ansi-color").set;

	minion.define("minion", {
		
		Client : minion.extend("minion.Singleton", {

			_args : {},
			_currentBuildIndex : 0,
			_buildGroups : [],
			_compiledClasses: [],
			_compressedFiles : [],

			setArgs : function (args){
				this._args = args;
			},
			
			build : function () {

				var path, outputPath, configFile, configObj, includeMinion;

				configFile = this._parsePath(this._args.c, null);

				// Load Config File
				if(configFile){
					configObj = this._getJSONFile(configFile);
				}
				// Otherwise, build the config obj ourselves
				else{

					includeMinion = this._args.i || false;
					path = this._parsePath(this._args.p, process.cwd());
					outputPath = this._parsePath(this._args.o, null);

					var c = this._args._[1];

					var buildGroup = {
		            "path" : path,
		            "output" : outputPath,
		            "classes" : [c],
		            "prepend_files" : [],
		            "append_files" : [],
		            "include_minion" : includeMinion,
		            "embed_provides" : false,
		            "jshint" : false
		        };

		        configObj = {build_groups: [buildGroup]};
				}

				if(configObj.vars){
					configObj = this._parseJSONTemplate(configObj.vars, configObj);
				}

				if(configObj.build_groups.length >= 1){
					this._buildGroups = configObj.build_groups;
					this._currentBuildIndex = 0;
					this._doBuild(this._buildGroups[0]);
				}
				else{
					this._logError("No build group found!!!")
				}
			},

			_doBuild : function (group) {

				var _classes = [];

				minion.configure({
					classPath : this._parsePath(group.path)
				});

				for(var j = 0; j < group.classes.length; j ++){
					var className = group.classes[j];
					if(className.indexOf("*") > -1){
						_classes = _classes.concat(this._getAllClassesInNamespace(className));
					}
					else{
						_classes.push(className);
					}
				}

				try{

					minion.clearLoadedClasses();

					minion.require(_classes, this.proxy(function(){

						var loadedClasses = minion.getLoadedClasses();
						var output = group.include_minion ? this._compress(__dirname + "/minion.js") : "";

						for(var i = loadedClasses.length-1; i >= 0; i --) {
							if(this._compiledClasses.indexOf(loadedClasses[i]) > -1){
								// If this file has already been compiled, and include_duplicates != true, exclude it from the list.
								if(!group.include_duplicates){
									loadedClasses.splice(i, 1);									
								}
							}
							else{
								this._compiledClasses.push(loadedClasses[i]);
							}
						}

						for(var i = 0; i < loadedClasses.length; i ++){
							var file = minion.getURL(loadedClasses[i]);
							output += this._compress(file);
						}

						if(group.output){
							fs.writeFile(group.output, output);	
						}
						else{
							this._logError("Please specify an output path for this build group...", _classes);
						}

						this._compressedFiles.push({
							file : this._relativePath(group.output, group.path),
							classes: loadedClasses
						})						

						// If there is another build group, let's build that one...
						if(this._buildGroups[this._currentBuildIndex+1]){
							this._currentBuildIndex += 1;
							this._doBuild(this._buildGroups[this._currentBuildIndex]);
							return;
						}

						// Otherwise, we can now output all the minion.provides code...
						console.log(color("----------------------------------------------------------------------------------------", "cyan"));
						console.log(color("Copy and paste the following into your code, before the first minion.require() call:", "cyan"));
						console.log(color("----------------------------------------------------------------------------------------", "cyan"));
						console.log("");

						for (var i = 0; i < this._compressedFiles.length; i ++) {
							var obj = this._compressedFiles[i];
							console.log(color('minion.provides("' + obj.file + '", ' + JSON.stringify(obj.classes) + ');', "cyan"));
						}

						console.log("");
						console.log(color("----------------------------------------------------------------------------------------", "cyan"));
						console.log("");
					}));
				}
				catch(e){
					this._logError("An unexpected error occured when trying to compile the following classes...", _classes);
				}
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

			_isAbsolutePath : function(path) {
				return (new RegExp("(http://|/)[^ :]+").test(path));
			},

			_parsePath : function (path, fallbackValue) {
				if(!path){return fallbackValue};
				return path[0] === "/" ? path : process.cwd() + "/" + path;
			},

			_getJSONFile : function (file) {
				var str = fs.readFileSync(file, 'utf-8');
				return JSON.parse(str);	
			},

			_writeJSONFile : function (file, obj) {
				fs.writeFile(file, JSON.stringify(obj, null, 4));
			},

			_parseJSONTemplate : function (vars, obj) {
				
				// String
				if(typeof obj === "string"){
					for (var v in vars){
						obj = obj.replace("{{" + v + "}}", vars[v]);
					}
					return obj;
				}
				// Array
				else if(obj instanceof Array){
					for(var i = 0; i < obj.length; i ++){
						obj[i] = this._parseJSONTemplate(vars, obj[i]);
					}
				}
				// Object
				else if(typeof obj === "object"){
					for (var prop in obj){
						obj[prop] = this._parseJSONTemplate(vars, obj[prop]);
					}
				}

				return obj;

			},

			_logError : function(err) {
				console.log(color("Error : " + err, "red+bold"));
			},

			_relativePath : function(path, rootPath) {
				path = path.replace(this._parsePath(rootPath), "");
				path = path.replace(rootPath, "");
				if(path[0] === "/"){
					path = path.substr(1);
				}
				return path;
			},

			// Recursively checks directories under the given namespace and returns a list of all Files/Classes in said namespace/directory.
			_getAllClassesInNamespace : function(namespace){

				var _classes = [];

				var dirPath = minion.getURL(namespace);
				var dirStats = fs.statSync(dirPath);

				namespace = namespace.replace(".*", "");

				if(!dirStats.isDirectory()){
					this._logError(dirPath + " is not a directory!");
					return [];
				}

				var files = fs.readdirSync(dirPath);

				for(var i = 0; i < files.length; i ++){
					var file = files[i];
					var fileStats = fs.statSync(dirPath + "/" + file);

					if(fileStats.isDirectory()){
						_classes = _classes.concat(this._getAllClassesInNamespace(namespace + "." + file + ".*"));
					}

					else{
						_classes.push(namespace + "." + file.replace(".js", ""));
					}
				}
				
				return _classes;
			}

		})

	});

})();