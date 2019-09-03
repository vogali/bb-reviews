'use strict';
 
module.exports = async (app) => {

	const swaggerUi = require('swagger-ui-express')
	const swaggerSpec = await app.swagger.getOpenAPI();

	app.get('/api/api-docs.json', function (req, res) {
		res.setHeader('Content-Type', 'application/json')
		res.send(swaggerSpec)
	});
	app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

};