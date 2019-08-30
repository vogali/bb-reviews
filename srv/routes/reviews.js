'use strict';
const HTTP_NO_CONTENT = 204
const HTTP_CREATED = 201
const HTTP_CONFLICT = 409
const HTTP_INTERNAL_SERVER_ERROR = 500

module.exports = function(app) {

	app.get('/api/v1/reviews', async function readAll(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside GET reviews')
		const result = await app.reviewsService.getAll(req)
		res.send(result)
	})

	app.get('/api/v1/reviews/:revieweeEmail', async function readAll(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside GET revieweeEmail')
		const revieweeEmail = req.params.revieweeEmail;
		const result = await app.reviewsService.getAllFor(revieweeEmail, req)
		res.send(result)
	})

	app.get('/api/v1/averageRatings/:email', async function getAverageUserRating(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside GET averageRatings')		
		const result = await app.reviewsService.getAverageRating(req.params.email, req)
		res.send(result)
	})

	app.post('/api/v1/reviews', async function create(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside POST reviews')	
		try {
			await app.reviewsService.create(req.body, req)
		} catch (err) {
			return res.status(HTTP_CONFLICT).end()
		}
		const reviewee_email = req.body.reviewee_email
		await app.reviewsService.getAverageRating(reviewee_email)		
		res.status(HTTP_CREATED).location(req.body.component_name).end()
	})

	app.delete('/api/v1/reviews', async function deleteAll(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside DELETE reviews')
		await app.reviewsService.deleteAll(req)
		res.status(HTTP_NO_CONTENT).end()
	})

	app.get('/api/v1/sleep', async function sleep(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside REST Sleep Handler')
		try {
			if (!await app.reviewsService.sleep.fire(req.db)) {
				throw { "Error": "Query Timeout" }
			}
			let now = new Date();
			return res.type("text/plain").send(`Sleep time is over: ${now.toLocaleTimeString()}`)
		} catch (error) {
			req.db.abort();
			req.loggingContext.getLogger('/Application/Reviews/CDSSleep').error(error)
			return res.status(HTTP_INTERNAL_SERVER_ERROR).send(error);
		}
	})
};