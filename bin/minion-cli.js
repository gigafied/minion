#!/usr/bin/env node
var argv = require('optimist').argv;
var method = argv._[0];
var minion = require("../lib/minion.js");

require("./minion.Interface.js");

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