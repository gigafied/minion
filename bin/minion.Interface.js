
var minion = require(__dirname + '/minion.js');
var fs = require("fs");
var color = require("ansi-color").set;
var jshint = require("jshint").JSHINT;

minion.define("minion", {
	
	Interface : minion.extend("minion.Singleton", {

		_args : {},
		_configObj : {},
		_currentBuildIndex : 0,
		_compiledClasses: [],
		_compressedFiles : [],
		_errored : false,
		_filesToWatch : [],
		_basePath : "",

		setArgs : function (args){
			this._args = args;
		},
		
		build : function (configFile, quiet, cb) {

			if(typeof quiet == "undefined") {quiet = false;}

			this._configObj = {};
			this._currentBuildIndex = 0;
			this._compiledClasses = [];
			this._compressedFiles = [];
			this._errored = false;
			this._filesToWatch = [];
			this._basePath = process.cwd();

			var path, outputPath, configObj, includeMinion;

			configFile = this._parsePath(this._args.c, this._parsePath(configFile, null));

			// Load Config File
			if(configFile){
				this._filesToWatch.push(configFile);
				configObj = this._getJSONFile(configFile);
				
				if(configFile.indexOf("/") > -1){
					if(this._isAbsolutePath(configFile)){
						this._basePath = "";
					}
					this._basePath += configFile.substr(0, configFile.lastIndexOf("/"));
				}
			}

			// Otherwise, build the config obj ourselves
			else{

				includeMinion = this._args.i || false;
				path = this._parsePath(this._args.p, process.cwd());
				output = this._parsePath(this._args.o, null);

				this._basePath = path;

				var c = this._args._[1];

				var buildGroup = {
	            "class_path" : path,
	            "output" : output,
	            "classes" : [c],
	            "prepend_files" : [],
	            "append_files" : [],
	            "include_minion" : includeMinion,
	            "embed_provides" : false,
	            "jshint" : this._args.jshint
	        };

	        configObj = {build_groups: [buildGroup]};

	        configObj.output_path = this._args.p;
			}

			if(this._args.w){
				configObj.watch = true;
			}

			if(configObj.vars){
				configObj = this._parseJSONTemplate(configObj.vars, configObj);
			}

			this._configObj = configObj;

			if(configObj.build_groups.length >= 1){
				this._currentBuildIndex = 0;
				this._doBuild(this._configObj.build_groups[0], quiet, cb);
			}
			else{
				if(!quiet){
					this._logError("No build group found!!!");
				}
				else{
					return new Error("No build group found!!!");
				}
			}
		},

		_doBuild : function (group, quiet, cb) {

			var _classes = [];
			var path = group.class_path || this._configObj.class_path;
			var output_path = group.output_path || this._configObj.output_path || path;

			minion.configure({
				classPath : this._parsePath(path)
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

				minion.require(_classes, this.proxy( function(){

					var loadedClasses = this._getAllDependencies(_classes);

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

					var jshint_check = group.jshint || this._configObj.jshint || false;
					var jshint_opts = group.jshint_options || this._configObj.jshint_options || {};

					for(var i = 0; i < loadedClasses.length; i ++){
						var file = minion.getURL(loadedClasses[i]);

						if(jshint_check){

							if(!jshint(this._getFileContents(file), jshint_opts)){
								this._logError("JSHINT failed on file... " + file);
								this._log("", "red+bold");
								this._log("------------------------------------------------------------------------------", "red+bold");
								this._log("", "red+bold");
								
								for (var j = 0; j < jshint.errors.length; j ++) {
									var error = jshint.errors[j];
									this._logError(("Line : " + error.line + ", Character : " + error.character + ", Reason : " + error.reason + "\n        " + this._trim(error.evidence)) + "\n");
								}

								//return;
							}
						}
						if(!this._errored){
							output += this._compress(file) + ";";
						}
						this._filesToWatch.push(file);
					}

					if(!this._errored){
						if(group.output){
							fs.writeFile(group.output, output);	
						}
						else{
							var err = "Please specify an output path for this build group..." + _classes.join(", ");
							if(!quiet){
								this._logError(err);
							}
							else{
								return new Error(err);
							}								
						}

						this._compressedFiles.push({
							file : this._outputPath(group.output, path, output_path),
							classes: loadedClasses
						});				

						// If there is another build group, let's build that one...
						if(this._configObj.build_groups[this._currentBuildIndex+1]){
							this._currentBuildIndex += 1;
							this._doBuild(this._configObj.build_groups[this._currentBuildIndex], quiet, cb);
						}

						if(!quiet){
							// Otherwise, we can now output all the minion.configure code...
							this._log("");
							this._log("");
							this._log("*********************************** BUILD SUCCESSFUL ************************************");
							this._log("");
							this._log("");
							this._log("----------------------------------------------------------------------------------------");
							this._log("Copy and paste the following into your code, before the first minion.require() call:");
							this._log("----------------------------------------------------------------------------------------");
							this._log("");
							this._log("minion.configure({paths: " + JSON.stringify(this._compressedFiles, null, 4) + "});");
							this._log("");
							this._log("----------------------------------------------------------------------------------------");
							this._log("");
						}

						if(cb){
							cb(this._compressedFiles);
						}
					}

					// If the watch flag was passed, set up watchers on all the loaded files, rebuilding whenever a file changes
					if(this._configObj.watch){
						if(!quiet){
							this._log("");
							this._log("****************************** WATCHING FOR CHANGES *********************************");							
							this._watchFiles();
						}
					}

				}));
			}
			catch(e){
				var err = "An unexpected error occured when trying to compile the following classes..." + _classes.join(", ");
				if(!quiet){
					this._logError(err);
				}
				else{
					return new Error(err);
				}
			}
		},

		_getFileContents : function(file){
			return fs.readFileSync(file, 'utf-8');	
		},

		_compress : function (file) {
			
			var fs = require('fs');
			var uglify = require('uglify-js').uglify;
			var parser = require('uglify-js').parser;

			var code = this._getFileContents(file);

			code = parser.parse(code);
			code = uglify.ast_mangle(code);
			code = uglify.ast_squeeze(code);
			code = uglify.gen_code(code);

			return code;				
		},

		_isAbsolutePath : function(path) {
			return path[0] === "/";
		},

		_parsePath : function (path, fallbackValue) {
			if(!path){return fallbackValue};
			return path[0] === "/" ? path : this._basePath + "/" + path;
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

		_trim : function(s) {
			return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		},

		_log : function (msg, clr){
			clr = clr || "cyan";
			console.log(color(msg, clr));
		},

		_logError : function(err) {
			if(!this._errored){
				this._log("");
				this._log("");				
				this._log("*********************************** BUILD FAILURE ************************************", "red+bold");
				this._log("");
				this._log("");
				this._errored = true;
			}

			this._log("Error : " + err, "red+bold");
		},

		_outputPath : function(path, rootPath, outputPath) {
			path = path.replace(this._parsePath(rootPath), "");
			path = path.replace(rootPath, "");
			outputPath = outputPath[outputPath.length-1] === "/" ? outputPath : outputPath + "/";
				if(path[0] === "/"){
				path = path.substr(1);
			}
			return outputPath + path;
		},

		// Recursively checks Class __dependencies and adds them all to an array
		_getAllDependencies : function (classes) {
			
			var dependencies = [];

			for(var i = 0; i < classes.length; i ++) {
				var c = minion.get(classes[i]);

				// Don't add the base minion classes to the dependency list as they are already compiled.
				if (c.__nsID !== "minion") {
					dependencies.push(classes[i]);

					if(c.__dependencies && c.__dependencies.length > 0){
						dependencies = dependencies.concat(this._getAllDependencies(c.__dependencies));
					}
				}
			}
			
			return dependencies;				
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

				else if(file.indexOf(".js") > -1){
					_classes.push(namespace + "." + file.replace(".js", ""));
				}
			}
			
			return _classes;
		},

		// Watches all files in this._filesToWatch and calls this._build() if any changes are made.
		_watchFiles : function (){
			for(var i = 0; i < this._filesToWatch.length; i ++) {
				var file = this._filesToWatch[i];
				fs.watchFile(file, {persistent: true, interval: 50}, this.proxy(function (curr, prev){
					if (+curr.mtime > +prev.mtime) {
						this._unwatchFiles();
						this.build();
					}
				}));
			}	
		},
		// Cleans up any watchers on this._filesToWatch files.
		_unwatchFiles : function(){
			for(var i = 0; i < this._filesToWatch.length; i ++) {
				var file = this._filesToWatch[i];
				fs.unwatchFile(file);
			}	
		}

	})
});

module.exports = minion.get("minion.Interface");