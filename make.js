(function(){

	var fs = require('fs');
	var jshint = require("jshint").JSHINT;
	
	var version = fs.readFileSync('./version.txt', 'utf-8');

	function getJSONFile (file) {
		var str = fs.readFileSync(file, 'utf-8');
		return JSON.parse(str);	
	}

	function writeJSONFile (file, obj) {
		fs.writeFile(file, JSON.stringify(obj, null, 4));
	}

	// Rewrite the package.json file with the appropriate version.
		var packageFile = "./package.json";
		var packageObj = getJSONFile(packageFile);

		packageObj.version = version;

		writeJSONFile(packageFile, packageObj);

	var jshint_passed = jshint(fs.readFileSync('./dist/minion-' + version + ".js", "utf-8"), {node : true, browser: true});

	console.log("");
	console.log("");

	if(!jshint_passed){
		console.log("JSHINT FAILED : ");
		console.log("");
		console.log("");
		console.log(jshint.errors);
	}
	else{
		console.log("JSHINT PASSED");
	}
	console.log("");
	console.log("");

})();