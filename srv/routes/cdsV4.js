'use strict';
module.exports = function(app) {

    const cds = require("@sap/cds")
	var odataURL = "/odata/v4/"
	//CDS OData V4 Handler
	var cdsOptions = {
		kind: "hana",
        logLevel: "error"
	};
	cds.connect(cdsOptions);
	// Main app
	cds.serve(
		"../srv/gen/csn.json", {
			crashOnError: false
		})
		.to("fiori")
		.at(odataURL)
		//	.with(require("./cat-service"))
		.in(app)
		.catch((err) => {
			app.logger.logMessage('error', err);
			process.exit(1);
		});
};