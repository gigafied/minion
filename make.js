(function(){

	var fs = require('fs');

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
		
})();