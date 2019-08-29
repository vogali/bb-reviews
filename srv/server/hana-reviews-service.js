'use strict'
function hanaReviewsService() {
    const dbClass = require("../utils/dbPromises");
    const circuitBreaker = require('opossum');
    const breakerOptions = {
        timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
        errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
        resetTimeout: 10000 // After 10 seconds, try again.
    };

    this.getAll = async function (req) {
        let db = new dbClass(req.db);
        try {
            const statement = await db.preparePromisified(`SELECT REVIEWEE_EMAIL as "reviewee_email", REVIEWER_EMAIL as "reviewer_email", RATING as "rating", COMMENT as "comment" FROM BB_REVIEWS`);
            const results = await db.statementExecPromisified(statement, []);
            return results
        } catch (error) {
            return error;
        }

    }

    this.getAllFor = async function (revieweeEmail, req) {
        let db = new dbClass(req.db);
        const statement = await db.preparePromisified(`SELECT REVIEWEE_EMAIL as "reviewee_email", REVIEWER_EMAIL as "reviewer_email", RATING as "rating", COMMENT as "comment" FROM BB_REVIEWS WHERE REVIEWEE_EMAIL = ?`);
        const results = await db.statementExecPromisified(statement, [revieweeEmail]);
        return results
    }


    this.getAverageRating = async function (revieweeEmail, req) {
        let db = new dbClass(req.db);
        const statement = await db.preparePromisified(`SELECT  avg(RATING) as "average_rating" FROM BB_REVIEWS WHERE REVIEWEE_EMAIL = ?`);
        const results = await db.statementExecPromisified(statement, [revieweeEmail]);
        return results[0]
    }

    async function sleep(req) {
        let db = new dbClass(req);
        const hdbext = require("@sap/hdbext");
        const sp = await db.loadProcedurePromisified(hdbext, null, 'sleep');
        const results = await db.callProcedurePromisified(sp, []);
        return results;
    }
    const breaker = new circuitBreaker(sleep, breakerOptions);
    breaker.fallback(() => {
        return false;
    });
    this.sleep = breaker;


    this.create = async function (review, req) {
        let db = new dbClass(req.db);
        const statement = await db.preparePromisified(`INSERT INTO BB_REVIEWS (REVIEWEE_EMAIL, REVIEWER_EMAIL, RATING, COMMENT) values(?, ?, ?, ?)`);
        await db.statementExecPromisified(statement, [review.reviewee_email, review.reviewer_email, review.rating, review.comment]);
        return

    }

    this.deleteAll = async function (req) {
        let db = new dbClass(req.db);
        const statement = await db.preparePromisified(`delete from BB_REVIEWS`);
        await db.statementExecPromisified(statement, []);
        return

    }
}
module.exports = hanaReviewsService