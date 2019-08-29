'use strict';

const bodyParser = require('body-parser')
const express = require('express')

module.exports = function (app) {
	const hanaReviewsService = require('./hana-reviews-service')
	app.reviewsService = new hanaReviewsService()
	app.logger = require('cf-nodejs-logging-support')

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

	//Health Check - Can we at least connect to underlying persistence?
	const health = require('@cloudnative/health-connect');
	let healthcheck = new health.HealthChecker();
	const hanaHealth = () => new Promise(function (resolve, _reject) {
		HDBConn.createConnection(hanaOptions.hana, function (error) {
			if (error) {
				_reject(error);
			}
			resolve()
		});
	});
	let startCheck = new health.StartupCheck("startCheck", hanaHealth);
	healthcheck.registerStartupCheck(startCheck);
	let liveCheck = new health.LivenessCheck("liveCheck", hanaHealth);
	healthcheck.registerLivenessCheck(liveCheck);

	app.use('/live', health.LivenessEndpoint(healthcheck))
	app.use('/ready', health.ReadinessEndpoint(healthcheck))
	app.use('/health', health.HealthEndpoint(healthcheck))
	app.use(require('express-status-monitor')())
	
	app.use(express.static('../app/webapp'))
	app.use(app.logger.logNetwork)

	app.use(
		HDBConn.middleware(hanaOptions.hana)
	);
};