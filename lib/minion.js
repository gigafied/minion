var fs = require("fs");
var color = require("ansi-color").set;
var jshint = require("jshint").JSHINT;
var path = require("path");

var preGlobal = global.minion;
var doLog = false;

/*
	Yes we are assigning a global variable of `minion`. We have to because browser-based implementations don't do
	var minion = require("minion"); at the top of every .js file (browsers have no way of doing this...)

	For building and consistency in being able to use minion in the browser + node in the same way, we make `minion`
	available everywhere.
*/

minion = module.exports = require("./minion.main.js");

require("./minion.baseclass.js");
require("./minion.class.js");
require("./minion.singleton.js");
require("./minion.static.js");
require("./minion.notifications.js");


/*
	Only included in the node.js version of minion. Provide the build() + watch() methods.
	Can be called programatically via minion.build(), minion.watch() or via the cli `minion build/watch [options]`
*/

minion.build = function (opts, cb, _doLog) {

	doLog = _doLog || false;
	cb = cb || function(){};

	var basePath = "./";
	var config;

	function getPath (_path, fallbackValue) {
		fallbackValue = fallbackValue || null;

		if(!_path) {return fallbackValue};
		if(_path[0] !== "/" && _path[0] !== "~") {
			_path = path.normalize(basePath + "/" + _path);
		}
		return _path;
	};

	// If opts is a string, let's assume it's a path to a config file.
	if(typeof opts == "string") {
		opts = {configFile: opts};
	}

	if(opts.configFile) {
		opts.configFile = getPath(opts.configFile, null);
		config = getJSONFile(opts.configFile);
	}

	else if(opts.build_groups) {
		config = opts;
	}

	if(config) {

		if(config.vars) {
			config = parseObj(config.vars, config);
		}

		basePath = opts.base_bath || path.dirname(opts.configFile);
		basePath = (basePath[0] != "/" && basePath[0] != "." && basePath[0] != "~") ? "./" + basePath : basePath;
		basePath = fs.realpathSync(basePath);

		config.class_path = getPath(config.class_path, process.cwd());
		config.output_path = config.output_path ||  "";

		for (var i = 0; i < config.build_groups.length; i ++) {
			var bg = config.build_groups[i];

			bg.class_path = getPath(bg.class_path, config.class_path);
			bg.output = getPath(bg.output);
		}
	}

	// Otherwise, build the config obj ourselves	
	else {
		
		basePath = fs.realpathSync(opts.base_path || basePath);

		opts.class_path = getPath(opts.class_path, process.cwd());
		opts.output_path = opts.output_path || "";

		config = {
			build_groups: [{
				"class_path" : opts.class_path,
				"output" : opts.output,
				"classes" : opts.classes,
				"prepend_files" : opts.append_files || [],
				"append_files" : opts.prepend_files || [],
				"include_minion" : opts.include_minion || false,
				"embed_provides" : opts.embed_proves || false,
				"jshint" : opts.jshint || false,
				"jshint_options" : opts.jshint_options || {browser: true, node: true}
			}],
			class_path: opts.class_path,
			output_path: opts.output_path
		};
	}

	if(!config.build_groups || config.build_groups.length < 1) {
		return err("No build group found!!");
	}

	var currentBuildIndex = 0;
	var compiledClasses = [];
	var provides = [];
	var loadedFiles = [];

	minion.configure({
		classPath: config.class_path,
	});

	doBuild(config.build_groups[0]);

	function doBuild(buildGroup) {

		var classes = [];

		for(var i = 0; i < buildGroup.classes.length; i ++) {
			var className = buildGroup.classes[i];
			if(className.indexOf("*") > -1) {
				classes = classes.concat(getAllClassesInNamespace(className));
			}
			else{
				classes.push(className);
			}
		}

		try{

			minion.require(classes, function() {

				var loadedClasses = getDependencies(classes);

				var output = buildGroup.include_minion ? uglify("./dist/minion-latest.js") : "";

				for(var i = loadedClasses.length-1; i >= 0; i --) {
					
					var lc = loadedClasses[i];

					if(compiledClasses.indexOf(lc) > -1) {
						// If this file has already been compiled, and include_duplicates != true, exclude it from the list.
						if(!buildGroup.include_duplicates) {
							loadedClasses.splice(i, 1);	
						}
					}
					else{
						compiledClasses.push(lc);
					}
				}

				var jshint_check = buildGroup.jshint || config.jshint || false;
				var jshint_opts = buildGroup.jshint_options || config.jshint_options || {};

				for(var i = 0; i < loadedClasses.length; i ++) {

					var file = minion.getURL(loadedClasses[i]);

					if(jshint_check) {

						if(!jshint(getFileContents(file), jshint_opts)) {
							
							err("");
							err("JSHINT failed on file " + color(file, "cyan"));
							err("");
							err("------------------------------------------------------------------------------");
							err("");
							
							for (var j = 0; j < jshint.errors.length; j ++) {
								var e = jshint.errors[j];
								err(
									color(
										["line", pad(e.line, 3, " "), ": char", pad(e.character, 3, " "),"  "].join(" "), 
										"red"
									) +
									color(
										e.reason, 
										"cyan"
									)
								);
								err(
									pad("", 22) + trim(e.evidence),
									"yellow"
								);
								err("");
							}
							err("");

							cb(err("JSHint Errors."), jshint.errors);
							return;

						}
					}
				}

				loadedFiles.push(file);

				if(!buildGroup.output) {
					cb(err("Please specify an output path for this build group..." + classes.join(", ")));
					return;
				}

				fs.writeFileSync(buildGroup.output, output);	

				provides.push({
					file : path.normalize((buildGroup.output_path || config.output_path) + "/" + path.basename(buildGroup.output)),
					classes: loadedClasses
				});

				// If there is another build group, let's build that one...
				if(config.build_groups[currentBuildIndex+1]) {
					currentBuildIndex ++;
					doBuild(config.build_groups[currentBuildIndex]);
					return;
				}

				// Otherwise, we can now output all the minion.configure code...
				log("");
				log("");
				log("*********************************** BUILD SUCCESSFUL ************************************");
				log("");
				log("");
				log("----------------------------------------------------------------------------------------");
				log("Copy and paste the following into your code, before the first minion.require() call:");
				log("----------------------------------------------------------------------------------------");
				log("");
				log(color("minion.configure({paths: " + JSON.stringify(provides, null, 4) + "});", "cyan+bold"));
				log("");
				log("----------------------------------------------------------------------------------------");
				log("");

				// If the watch flag was passed, set up watchers on all the loaded files, rebuilding whenever a file changes
				if(opts.watch) {
					log("");
					log("****************************** WATCHING FOR CHANGES *********************************");							
					if(opts.configFile){loadedFiles.push(opts.configFile);}
					
					watchFiles(loadedFiles, function () {
						minion.build(opts, cb, _doLog);
					});
				}

				cb(null, provides);
				return;
			});
		}

		catch(e) {
			var err = err("An unexpected error occured when trying to compile the following classes..." + classes.join(", "));
			cb(err);
			return err;
		}
	};

}

minion.watch = function (opts, cb, _doLog) {

	// If opts is a string, let's assume it's a path to a config file.
	if(typeof opts == "string") {
		opts = {configFile: opts};
	}

	opts.watch = true;
	minion.build(opts, cb, _doLog);
};


////////////////////////////////////// HELPER METHODS ////////////////////////////////////// 

function watchFiles (files, cb) {
	for(var i = 0; i < files.length; i ++) {
		var file = files[i];
		fs.watchFile(file, {persistent: true, interval: 50}, function (curr, prev){
			if (+curr.mtime > +prev.mtime) {
				unwatchFiles(files);
				cb();
			}
		});
	}
};

function unwatchFiles (files) {
	for(var i = 0; i < files.length; i ++) {
		var file = files[i];
		fs.unwatchFile(file);
	}
};

function log (msg) {
	if(doLog) {
		console.log(msg);
	}
	return msg;
};

function err (msg) {
	if(doLog) {
		console.error(msg);
	}
	return new Error(msg);
};


function parseObj (vars, obj) {
	
	// String
	if(typeof obj === "string") {
		for (var v in vars) {
			obj = obj.replace("{{" + v + "}}", vars[v]);
		}
		return obj;
	}
	// Array
	else if(obj instanceof Array) {
		for(var i = 0; i < obj.length; i ++) {
			obj[i] = parseObj(vars, obj[i]);
		}
	}
	// Object
	else if(typeof obj === "object") {
		for (var prop in obj) {
			obj[prop] = parseObj(vars, obj[prop]);
		}
	}

	return obj;

};

// Recursively checks Class.__dependencies and adds them all to an array
function getDependencies (classes) {
	
	var dependencies = [];

	for(var i = 0; i < classes.length; i ++) {

		var c = minion.get(classes[i]);

		// Don't add the base minion classes to the dependency list as they are already compiled.
		if (minion.getAliases().indexOf(c.__nsID) < 0) {

			dependencies.push(classes[i]);

			if(c.__dependencies && c.__dependencies.length > 0) {
				dependencies = dependencies.concat(getDependencies(c.__dependencies));
			}
		}
	}
	
	return dependencies;				
};

// Recursively checks directories under the given namespace and returns a list of all Files/Classes in said namespace/directory.
function getAllClassesInNamespace (namespace) {

	var classes = [];

	var dirPath = minion.getURL(namespace);
	var dirStats = fs.statSync(dirPath);

	namespace = namespace.replace(minion.separator() + "*", "");

	if(!dirStats.isDirectory()) {
		err("Unable to get classes in " + namespace + ". " + dirPath + " is not a directory!");
		return [];
	}

	var files = fs.readdirSync(dirPath);

	for(var i = 0; i < files.length; i ++) {
		var file = files[i];
		var fileStats = fs.statSync(dirPath + "/" + file);

		if(fileStats.isDirectory()) {
			classes = classes.concat(getAllClassesInNamespace(namespace + minion.separator() + file + ".*"));
		}

		else if(file.indexOf(".js") > -1) {
			classes.push(namespace + minion.separator() + file.replace(".js", ""));
		}
	}
	
	return classes;
};

function uglify (file) {
	
	var uglify = require('uglify-js').uglify;
	var parser = require('uglify-js').parser;

	var code = getFileContents(file);

	code = parser.parse(code);
	code = uglify.ast_mangle(code);
	code = uglify.ast_squeeze(code);
	code = uglify.gen_code(code);

	return code;
};

function pad (str, len, padChar) {
	
	str = str.toString();

	if(typeof padChar == "undefined"){padChar = " ";}

	while(str.length < len) {
		str = padChar + str;
	}
	return str;
};

function trim (str) {
	var	str = str.replace(/^\s\s*/, ''),
		ws = /\s/,
		i = str.length;
	while (ws.test(str.charAt(--i)));
	return str.slice(0, i + 1);
};


function getFileContents (file) {
	return fs.readFileSync(file, 'utf-8');	
};


function getJSONFile (file) {
	var str = fs.readFileSync(file, 'utf-8');
	return JSON.parse(str);
};