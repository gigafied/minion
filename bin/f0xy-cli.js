#!/usr/bin/env node

(function(){

	f0xy = require('./f0xy.js');

	var argv = require('optimist').argv;

	var method = argv._[0];

	f0xy.provides("./f0xy.Client.js", "f0xy.Client");

	f0xy.require("f0xy.Client", function(Client){

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