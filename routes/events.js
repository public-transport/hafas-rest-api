'use strict'

const createServer = require('hafas-monitor-trips-server')
const SSE = require('ssestream').default
const {parseNumber} = require('../lib/parse')

const EVENTS = [
	'trip', 'new-trip', 'trip-obsolete',
	'stopover',
	'position',
	// todo: stats?
]

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createEventsRoute = (hafas, config) => {
	const monitor = createServer(hafas)

	const events = (req, res, next) => {
		const {logger} = req.app.locals

		const bbox = {}
		for (const param of ['north', 'west', 'south', 'east']) {
			if (param in req.query) {
				bbox[param] = parseNumber(param, req.query[param])
			} else {
				return next(err400(`missing ${param} query parameter`))
			}
		}

		const events = EVENTS.filter(evName => req.query[evName] === 'true')
		if (events.length === 0) return next(err400('0 events selected'))

		const sse = new SSE(req)
		sse.pipe(res)
		const handlers = events.map((evName) => {
			const sendEvent = (data) => {
				logger.debug({event: evName, data, bbox})
				sse.write({event: evName, data})
			}
			return [evName, sendEvent]
		})

		const sub = monitor.subscribe(bbox)
		for (const [evName, handler] of handlers) {
			sub.on(evName, handler)
		}
		logger.info({bbox}, 'starting monitor')
		res.once('close', () => {
			logger.info({bbox}, 'stopping monitor')
			sub.destroy()
		})

		sub.on('error', (err) => {
			logger.error({bbox}, err)
			sse.write({event: 'error', data: err.message || (err + '')})
		})
	}

	events.cache = false
	events.queryParameters = [
		...EVENTS,
		'north', 'west', 'south', 'east',
	]
	return events
}

module.exports = createEventsRoute
