'use strict';
module.exports = function(app) {

	const swaggerUi = require('swagger-ui-express')
	let swaggerJSDoc = require('swagger-jsdoc')

	var options = {
		swaggerDefinition: {
			openapi: '3.0.0',
			info: {
				title: 'Bulletin Board Reviews',
				version: '1.0.0'
			}
		},
		apis: ['./routes/*']
	}
	var swaggerSpec = swaggerJSDoc(options)
	app.get('/api/api-docs.json', function (req, res) {
		res.setHeader('Content-Type', 'application/json')
		res.send(swaggerSpec)
	});
	app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

};