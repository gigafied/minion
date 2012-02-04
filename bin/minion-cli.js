#!/usr/bin/env node

minion = require("./minion.js");

var argv = require('optimist').argv;

var method = argv._[0];

minion.provides("./minion.Interface.js", "minion.Interface");

minion.require("minion.Interface", function(Interface) {

	var cli = Interface.getInstance();
	cli.setArgs(argv);

	if(method[0] !== "_" && cli[method]){
		return cli[method]();
	}

	else{
		console.log("Invalid command.");
	}

});