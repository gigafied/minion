/*
	Yes, we're assigning "minion" as a global var. Deal with it, it solves more issues than it creates doing it this way.
	The reason being, as a huge part of Minion is working in the browser, minion is a global var in the browser.
	Thus, it carries over into node.js.
*/

module.exports = minion = require("./minion.main.js");

require("./minion.baseclass.js");
require("./minion.class.js");
require("./minion.singleton.js");
require("./minion.static.js");
require("./minion.notifications.js");
require("./minion.node.js");

minion.build();