"use strict";
const dbClass = require("../../utils/dbPromises");
const circuitBreaker = require('opossum');
const breakerOptions = {
    timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 10000 // After 10 seconds, try again.
};

async function sleep(req) {
    let db = new dbClass(req);
    const hdbext = require("@sap/hdbext");
    const sp = await db.loadProcedurePromisified(hdbext, null, 'sleep');
    const results = await db.callProcedurePromisified(sp, []);
    return results;
}

//module.exports = srv => {
    module.exports = function () {
    
    this.on('sleep', async (req) => {
        if(req._.req.db){      
            const breaker = new circuitBreaker(sleep, breakerOptions)
            breaker.fallback(() => {
                return false
            })
            try{
                if (!await breaker.fire(req._.req.db)) {
                    throw { "Error": "Query Timeout" }
                }
                return true                
            } catch(error){
                req._.req.logMessage('error', error)
                req._.req.db.abort()
                return false    
            }           
        }
        return false
    })
}    