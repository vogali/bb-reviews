'use strict';
module.exports = async (app) => {

	const swaggerUi = require('swagger-ui-express')
	let swaggerJSDoc = require('swagger-jsdoc')

	var options = {
		swaggerDefinition: {
			openapi: '3.0.0',
			info: {
				title: 'Bulletin Board Reviews',
				version: '1.0.0',
				"x-odata-version": '4.0'
			}
		},
		apis: ['./routes/*']
	}
	var swaggerSpec = swaggerJSDoc(options)

	const { parse, convert } = require('odata2openapi');
	const cds = require("@sap/cds")
	const csn = await cds.load(["../srv/gen/csn.json"])
	let metadata = cds.compile.to.edmx(csn, { version: 'v4', })

	const odataOptions = {}
	try {
		let service = await parse(metadata)
		let swagger = await convert(service.entitySets, odataOptions, service.version)
		console.log(JSON.stringify(swagger, null, 2))
		Object.keys(swagger.paths).forEach(function(key) {
			let val = swagger.paths[key]
			swaggerSpec.paths[`/odata/v4/catalog${key}`] = val
		})
		swaggerSpec.definitions = swagger.definitions
	} catch (error) {
		console.error(error)
	}



	app.get('/api/api-docs.json', function (req, res) {
		res.setHeader('Content-Type', 'application/json')
		res.send(swaggerSpec)
	});
	app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

};