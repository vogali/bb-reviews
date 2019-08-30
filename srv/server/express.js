'use strict';

const bodyParser = require('body-parser')
const express = require('express')

module.exports = function (app) {
	const hanaReviewsService = require('./hana-reviews-service')
	app.reviewsService = new hanaReviewsService()
	app.logger = require('cf-nodejs-logging-support')
	app.logger.setLoggingLevel("error");

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

	require('./expressSecurity')(app)
	app.use(require('express-status-monitor')())

	app.use(express.static('../app/webapp'))
	app.use(app.logger.logNetwork)

	app.use(
		HDBConn.middleware(hanaOptions.hana)
	);
};