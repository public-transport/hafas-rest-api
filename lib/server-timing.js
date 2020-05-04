'use strict'

const CACHED = Symbol.for('cached-hafas-client:cached')
// cached-hafas-client + hafas-client!
const TOTAL_CACHE_TIME = Symbol.for('cached-hafas-client:time')

const sendServerTiming = (res, hafasResponse) => {
	const cached = hafasResponse[CACHED] === true
	const cacheTime = hafasResponse[TOTAL_CACHE_TIME]
	if (Number.isInteger(cacheTime)) {
		res.serverTiming[cached ? 'cache' : 'hafas'] = cacheTime
	}
	res.setHeader('X-Cache', cached ? 'HIT' : 'MISS')
}

module.exports = sendServerTiming
