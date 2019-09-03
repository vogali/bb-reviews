'use strict';
const HTTP_NO_CONTENT = 204
const HTTP_NOT_IMPLEMENTED = 501
const HTTP_INTERNAL_SERVER_ERROR = 500

module.exports = function(app) {
	/**
	 * @swagger
	 *
	 * /api/v1/newFeature:
	 *   get:
	 *     summary: Call the remote feature flags service to see if flag-name-1 is activated
	 *     responses:
	 *       '200':
	 *         description: New Feature of this Service
	 *         content:
	 *           text/plain: 
	 *             schema:
	 *               type: string
	 *       '501':
	 *         description: flag-name-1 is deactivated
	 *       '500':
	 *         description: Application Error 
	 */	
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

	/**
	 * @swagger
	 *
	 * /api/v1/exportFeatureFlags:
	 *   get:
	 *     summary: Export all feature flag details for this service
	 *     responses:
	 *       '200':
	 *         description: Feature Flags Details
	 *         content:
	 *           application/json: 
	 *             schema:
	 *               type: object
	 *       '204':
	 *         description: No feature flags for this service
	 *       '500':
	 *         description: Application Error 
	 */		
	app.get('/api/v1/exportFeatureFlags', async function exportFeatureFlags(req, res) {
		try {
			let exportData = await app.featureFlags.exportFeatureFlags();
			if (exportData) { res.type("application/json").send(exportData) }
			else { res.status(HTTP_NO_CONTENT).end() }
		} catch (error) {
			return res.type("text/plain").status(HTTP_INTERNAL_SERVER_ERROR).send(`ERROR: ${error.toString()}`);
		}

	})

	/**
	 * @swagger
	 *
	 * /api/v1/monitor:
	 *   get:
	 *     summary: Prometheus monitoring data including circuit breaker details
	 *     responses:
	 *       '200':
	 *         description: Prometheus monitoring data
	 *         content:
	 *           text/plain: 
	 *             schema:
	 *               type: string
	 *       '204':
	 *         description: No monitor data collected
	 *       '500':
	 *         description: Application Error 
	 */		
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