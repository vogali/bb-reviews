'use strict';

const bodyParser = require('body-parser')
const express = require('express')

module.exports = function (app) {


	let logging = require('@sap/logging');
	let appContext = logging.createAppContext({})
	app.logger = appContext.createLogContext().getLogger('/Application')

	const hanaReviewsService = require('./hana-reviews-service')
	app.reviewsService = new hanaReviewsService()

	const featureFlags = require('./featureFlags')
	app.featureFlags = new featureFlags(app.logger)

	const swagger = require('./swagger')
	app.swagger = new swagger()

	const xsenv = require("@sap/xsenv")
	xsenv.loadEnv()
	const HDBConn = require("@sap/hdbext")
	let hanaOptions = xsenv.getServices({
		hana: {
			tag: "hana"
		}
	});
	hanaOptions.hana.pooling = true;

	app.use(bodyParser.json())

	require('./healthCheck')(app, { hdbext: HDBConn, hanaOptions: hanaOptions })
	require('./overloadProtection')(app)
	app.use(require('express-status-monitor')())
	
	require('./expressSecurity')(app)


	app.use(express.static('../app/webapp'))
	app.use(logging.middleware({ appContext: appContext, logNetwork: true }));

	app.use(
		HDBConn.middleware(hanaOptions.hana)
	);
};