'use strict';
const HTTP_NO_CONTENT = 204
const HTTP_NOT_IMPLEMENTED = 501
const HTTP_INTERNAL_SERVER_ERROR = 500

module.exports = function(app) {
	app.get('/api/v1/newFeature', async function newFeature(req, res) {
		try {
			if (await app.featureFlags.evaluateV2.fire('flag-name-1')) {
				res.send(`New Feature of this Service`);
			} else {
				res.status(HTTP_NOT_IMPLEMENTED).send(`Deactivated Feature`);
			}
		} catch (error) {
			return res.type("text/plain").status(HTTP_INTERNAL_SERVER_ERROR).send(`ERROR: ${error.toString()}`);
		}

	})

	app.get('/api/v1/exportFeatureFlags', async function exportFeatureFlags(req, res) {
		try {
			let exportData = await app.featureFlags.exportFeatureFlags();
			if (exportData) { res.type("application/json").send(exportData) }
			else { res.status(HTTP_NO_CONTENT).end() }
		} catch (error) {
			return res.type("text/plain").status(HTTP_INTERNAL_SERVER_ERROR).send(`ERROR: ${error.toString()}`);
		}

	})

	app.get('/api/v1/monitor', async function monitor(req, res) {
		try {
			let exportData = await app.featureFlags.monitor();
			if (exportData) { res.type("text/plain").send(exportData) }
			else { res.status(HTTP_NO_CONTENT).end() }
		} catch (error) {
			return res.type("text/plain").status(HTTP_INTERNAL_SERVER_ERROR).send(`ERROR: ${error.toString()}`);
		}

	})
};