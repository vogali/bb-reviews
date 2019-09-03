'use strict';
const HTTP_NO_CONTENT = 204
const HTTP_CREATED = 201
const HTTP_CONFLICT = 409
const HTTP_INTERNAL_SERVER_ERROR = 500

module.exports = function (app) {

	/**
	 * @swagger
	 *
	 * components:
	 *   schemas:
	 *     Review:
	 *       type: object
	 *       properties:
	 *         reviewee_email:
	 *           type: string
	 *         reviewer_email:
	 *           type: string
	 *         rating:
	 *           type: integer
	 *         comment:
	 *           type: string
	 */

	/**
	 * @swagger
	 *
	 * /api/v1/reviews:
	 *   get:
	 *     summary: Get a list of Reviews
	 *     tags:
	 *       - Reviews
	 *     responses:
	 *       '200':
	 *         description: A List of reviews
	 *         content:
	 *           application/json: 
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/Review'
	 */
	app.get('/api/v1/reviews', async function readAll(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside GET reviews')
		const result = await app.reviewsService.getAll(req)
		res.send(result)
	})

	/**
	 * @swagger
	 *
	 * /api/v1/reviews/{revieweeEmail}:
	 *   get:
	 *     summary: Get a list of Reviews
	 *     tags:
	 *       - Reviews 
	 *     parameters:
	 *       - name: revieweeEmail
	 *         in: path
	 *         description: Reviewee Email Address
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       '200':
	 *         description: A List of reviews
	 *         content:
	 *           application/json: 
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/Review'
	 */
	app.get('/api/v1/reviews/:revieweeEmail', async function readAll(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside GET revieweeEmail')
		const revieweeEmail = req.params.revieweeEmail;
		const result = await app.reviewsService.getAllFor(revieweeEmail, req)
		res.send(result)
	})

	/**
	 * @swagger
	 *
	 * /api/v1/averageRatings/{email}:
	 *   get:
	 *     summary: Get Average Rating
	 *     tags:
	 *       - Reviews  
	 *     parameters:
	 *       - name: email
	 *         in: path
	 *         description: Reviewee Email Address
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       '200':
	 *         description: Average Rating
	 *         content:
	 *           application/json: 
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 average_rating:
	 *                   type: integer
	 *                   description: Average Rating
	 */
	app.get('/api/v1/averageRatings/:email', async function getAverageUserRating(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside GET averageRatings')
		const result = await app.reviewsService.getAverageRating(req.params.email, req)
		res.send(result)
	})

	/**
	 * @swagger
	 *
	 * /api/v1/reviews:
	 *   post:
	 *     summary: Create a new Reviews
	 *     tags:
	 *       - Reviews 
	 *     requestBody:
	 *       description: New Review Details
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/Review'
	 *     responses:
	 *       '201':
	 *         description: New Review Created
	 *       '409':
	 *         description: Error during DB Insertion - Duplicate Key
	 */
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

	/**
	 * @swagger
	 *
	 * /api/v1/reviews:
	 *   delete:
	 *     summary: Delete All Reviews
	 *     tags:
	 *       - Reviews
	 *     responses:
	 *       '204':
	 *         description: Sucessful Deletion
	 */
	app.delete('/api/v1/reviews', async function deleteAll(req, res) {
		req.loggingContext.getTracer(__filename).info('Inside DELETE reviews')
		await app.reviewsService.deleteAll(req)
		res.status(HTTP_NO_CONTENT).end()
	})

	/**
	 * @swagger
	 *
	 * /api/v1/sleep:
	 *   get:
	 *     summary: Call the Sleep Stored Procedure to simulate a long running DB query
	 *     tags:
	 *       - Sleep  
	 *     responses:
	 *       '200':
	 *         description: Sleep Timer is Over
	 *         content:
	 *           text/plain: 
	 *             schema:
	 *               type: string
	 *       '500':
	 *         description: Application Error 
	 */
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