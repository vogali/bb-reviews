function swagger() {

    this.getOpenAPI = async () => {
        let swaggerJSDoc = require('swagger-jsdoc')

        var options = {
            swaggerDefinition: {
                openapi: '3.0.0',
                info: {
                    title: 'Bulletin Board Reviews',
                    version: '1.0.0',
                    "x-odata-version": '4.0'
                },
                tags: [
                    {
                        name: "Reviews"
                    },
                    {
                        name: "FeatureFlags"
                    },
                    {
                        name: "Sleep"
                    },
                    {
                        name: "Monitoring"
                    }                ],
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
            Object.keys(swagger.paths).forEach(function (key) {
                let val = swagger.paths[key]
                swaggerSpec.paths[`/odata/v4/catalog${key}`] = val
            })
            swaggerSpec.definitions = swagger.definitions
            return swaggerSpec
        } catch (error) {
            console.error(error)
            return
        }
    }
}
module.exports = swagger