"use strict";

function featureFlags(logger) {

    const xsenv = require("@sap/xsenv");
    xsenv.loadEnv();
    var ffOptions = xsenv.getServices(
        { "featureFlags": { name: "bulletinBoardFF" } });

    const cache = require('memory-cache');
    let cacheTimeout = parseInt(process.env.CACHETIMEOUT) || 10000;

    const CircuitBreaker = require('opossum');
    const PrometheusMetrics = require('opossum-prometheus');
    const options = {
        timeout: 1000, // If our function takes longer than 1 seconds, trigger a failure
        errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
        resetTimeout: 10000 // After 10 seconds, try again.
    };

    function checkCache(flagName, identifier) {
        let cacheValue = cache.get(flagName + identifier)
        if (cacheValue) {
            logger.info(`Feature Flag From Cache: ${flagName}, ID: ${identifier} Status: ${cacheValue}`);
            if (cacheValue === 200) {
                return true;
            }
            return false;
        }
    }

    function checkCacheComplex(key) {
        let cacheValue = cache.get(key)
        if (cacheValue) {
            logger.info(`Feature Flag From Cache Key: ${key}, Status: ${cacheValue}`);
            return cacheValue;
        }
    }

    function buildHeaders() {
        let auth = 'Basic ' + Buffer.from(ffOptions.featureFlags.username + ':' + ffOptions.featureFlags.password).toString('base64');
        return {
            'User-Agent': 'Mozilla/5.0 (X11; Linux i686; rv:7.0.1) Gecko/20100101 Firefox/7.0.1',
            'Accept-Encoding': 'gzip, deflate',
            'Authorization': auth,
            'Cache-Control': 'max-age=0'
        };
    }

    function buildReqOptions() {
        return {
            headers: buildHeaders(ffOptions),
            retry: true,
            maxRetries: 3,
            timeout: 1500
        }
    }

    //GET /api/v1/evaluate/{feature_flag_name}
    this.evaluate = async function evaluate(flagName, identifier) {
        try {
            let cacheReturn = checkCache(flagName, identifier);
            if (cacheReturn) { return cacheReturn }

            let request = require('then-request');
            let uri = ffOptions.featureFlags.uri + `/api/v1/evaluate/${flagName}`;
            if (!identifier === null) {
                uri += `?identifier=${identifier}`
            }
            let res = await request('GET', uri, buildReqOptions());

            logger.info(`Feature Flag: ${flagName}, ID: ${identifier} Status: ${res.statusCode}`);
            cache.put(flagName + identifier, res.statusCode, cacheTimeout);
            if (res.statusCode === 200) {
                return true;
            }
            return false;
        } catch (err) {
            logger.error(err);
            return false;
        }

    }

    //GET /api/v1/features/export
    this.exportFeatureFlags = async function exportFeatureFlags() {
        try {
            let request = require('then-request');
            let uri = ffOptions.featureFlags.uri + `/api/v1/features/export`;
            logger.info(`Feature Flag Export`);
            let res = await request('GET', uri, buildReqOptions());
            if (res.statusCode === 200) {
                return res.body;
            }
            return false;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }

    //GET /api/v2/evaluateset
    // set is array of flagName and identifier
    // Example Call: await require('./util/feature-flags').evaluateSet([{"flagName":"flag-name-1"}, {"flagName":"flag-name-2"}])
    this.evaluateSet = async function evaluateSet(set) {
        try {
            let request = require('then-request');
            let uri = ffOptions.featureFlags.uri + `/api/v2/evaluateset?`;
            let key = '';
            for (let item of set) {
                key += `&flag=${item.flagName}`;
                if (!item.identifier === null) {
                    key += `&identifier=${item.identifier}`
                }
            }
            uri += key;
            let cacheReturn = checkCacheComplex(key);
            if (cacheReturn) { return cacheReturn }

            let res = await request('GET', uri, buildReqOptions());
            logger.info(`Feature Flag Batch Request`);
            if (res.statusCode === 200 | 207) {
                cache.put(key, JSON.parse(res.getBody()), cacheTimeout);
                return JSON.parse(res.getBody());
            }
            return false;
        } catch (err) {
            logger.error(err);
            throw err;
        }

    }

    //GET /api/v2/evaluate/{feature_flag_name}
    async function evaluateV2(flagName, identifier, errorVariation) {
        try {

            let request = require('then-request');
            let uri = ffOptions.featureFlags.uri + `/api/v2/evaluate/${flagName}?`;
            if (!identifier === null) {
                uri += `&identifier=${identifier}`
            }
            if (!identifier === null) {
                uri += `&errorVariation=${errorVariation}`
            }
            let res = await request('GET', uri, buildReqOptions());
            let cacheReturn = checkCacheComplex(uri);
            if (cacheReturn) {
                let body = JSON.parse(res.getBody());
                if (body.type === 'BOOLEAN' && body.variation === 'true') {
                    return true;
                } else if (body.type === 'BOOLEAN') {
                    return false;
                }
                return body.variation;
            }

            logger.info(`Feature Flag: ${flagName}, ID: ${identifier}, Error Variation: ${errorVariation} Status: ${res.getBody()}`);
            cache.put(uri, JSON.parse(res.getBody()), cacheTimeout);
            if (res.statusCode === 200) {
                let body = JSON.parse(res.getBody());
                if (body.type === 'BOOLEAN' && body.variation === 'true') {
                    return true;
                } else if (body.type === 'BOOLEAN') {
                    return false;
                }
                return body.variation;
            }
            return false;
        } catch (err) {
            logger.error(err);
            return false;
        }

    }
    const breaker = new CircuitBreaker(evaluateV2, options);
    const prometheus = new PrometheusMetrics([breaker]);
    breaker.fallback(() => false);
    breaker.on('open', () => {
        console.log(prometheus.metrics);
        logger.error(`Circuit Breaker has been opened!`)
    });
    breaker.on('close', () => {
        console.log(prometheus.metrics);
        logger.error(`Circuit Breaker has been closed`)
    });
    breaker.on('halfOpen', () => {
        console.log(prometheus.metrics);
        logger.error(`Circuit Breaker is half open`)
    });
    this.evaluateV2 = breaker;


    this.monitor = async function monitor() {
        return prometheus.metrics;
    }

}
module.exports = featureFlags