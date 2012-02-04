#!/usr/bin/env node

(function(){

	minion = require(__dirname + '/minion.js');

	var argv = require('optimist').argv;

	var method = argv._[0];

	minion.provides("./minion.Interface.js", "minion.Interface");

	minion.require("minion.Interface", function(Client){

		var client = Client.getInstance();
		client.setArgs(argv);

		if(method[0] !== "_" && client[method]){
			return client[method]();
		}

		else{
			console.log("Invalid command.");
		}

	});

})();