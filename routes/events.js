'use strict'

const createServer = require('hafas-monitor-trips-server')
const SSE = require('ssestream').default
const {parseNumber} = require('../lib/parse')

const EVENT_STREAM = 'text/event-stream'

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

const sseWriter = (req, res, evNames) => {
	const sse = new SSE(req)
	sse.pipe(res)

	const createHandler = (evName) => {
		const sendEvent = (data) => {
			sse.write({event: evName, data})
		}
		return [evName, sendEvent]
	}
	return [
		...evNames.map(createHandler),
		['error', (err) => {
			sse.write({event: 'error', data: err.message || (err + '')})
		}]
	]
}

const createEventsRoute = (hafas, config) => {
routes/monitor.js
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

		if (req.accepts(EVENT_STREAM) !== EVENT_STREAM) {
			return next(err400(`only ${EVENT_STREAM}`))
		}

		const handlers = sseWriter(req, res, events)
		const sub = monitor.subscribe(bbox)
		handlers
		.filter(([evName]) => evName !== 'error')
		.forEach(([evName, handler]) => {
			sub.on(evName, (data) => {
				logger.debug({event: evName, data, bbox})
				handler(data)
			})
		})

		logger.info({bbox}, 'starting monitor')
		res.once('close', () => {
			logger.info({bbox}, 'stopping monitor')
			sub.destroy()
		})

		const onError = handlers.find(([evName]) => evName === 'error')[1]
		sub.on('error', (err) => {
			logger.error({bbox}, err)
			onError(err)
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