'use strict';
module.exports = function (app) {

    const cds = require("@sap/cds")
    var odataURL = "/odata/v4/catalog";
    //CDS OData V4 Handler
    let cdsOptions = {
        kind: "hana",
        logLevel: "error"
    };
    cds.connect(cdsOptions);
    cds.serve(
        "../srv/gen/csn.json", {
            crashOnError: false
        })
        .to("fiori")
        .at(odataURL)
        .with(require("../lib/handlers/my-service"))
        .in(app)
        .catch((err) => {
            app.logger.error(err);
            process.exit(1);
        });

    //V2 Fallback handler
    cds.serve(
        "../srv/gen/csn.json", {
            crashOnError: false
        })
        .to("fiori")
        .in(app)
        .with(require("../lib/handlers/my-service"))        
        .catch((err) => {
            app.logger.error(err);
            process.exit(1);
        });
    const odatav2proxy = require("@sap/cds-odata-v2-adapter-proxy");
    app.use(odatav2proxy({ path: "odata/v2", port: process.env.PORT || 4000 }));

};