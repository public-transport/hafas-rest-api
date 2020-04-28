'use strict'

const {
	parseStop,
	parseBoolean,
	parseString,
	parseQuery
} = require('../lib/parse')

const parsers = {
	linesOfStops: {
		description: 'Parse & expose lines at each stop/station?',
		type: 'boolean',
		default: false,
		parse: parseBoolean,
	},
	language: {
		description: 'Language of the results.',
		type: 'string',
		default: 'en',
		parse: parseString,
	},
}

const createRoute = (hafas, config) => {
	const stop = (req, res, next) => {
		if (res.headersSent) return next()

		const id = parseStop('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'stop', req)

		hafas.stop(id, opt)
		.then((stop) => {
			res.allowCachingFor(5 * 60) // 5 minutes
			res.json(stop)
			next()
		})
		.catch(next)
	}

	stop.pathParameters = {
		'id': {
			description: 'stop/station ID',
			type: 'string',
		},
	}
	stop.queryParameters = {
		...parsers,
	}
	return stop
}

module.exports = createRoute
