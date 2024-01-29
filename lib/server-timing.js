import {CACHED, TOTAL_CACHE_TIME} from './caching.js'

const sendServerTiming = (res, hafasResponse) => {
	const cached = hafasResponse[CACHED] === true
	// cached-hafas-client + hafas-client!
	const cacheTime = hafasResponse[TOTAL_CACHE_TIME]
	if (Number.isInteger(cacheTime)) {
		res.serverTiming[cached ? 'cache' : 'hafas'] = cacheTime
	}
	// todo: alternatively, use hafas-client's reponse time value
	res.setHeader('X-Cache', cached ? 'HIT' : 'MISS')
}

export {
	sendServerTiming,
}
