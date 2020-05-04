'use strict'

const {
	parseBoolean,
	parseString,
	parseQuery
} = require('../lib/parse')
const sendServerTiming = require('../lib/server-timing')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const parsers = {
	stopovers: {
		description: 'Fetch & parse stopovers on the way?',
		type: 'boolean',
		default: false,
		parse: parseBoolean,
	},
	tickets: {
		description: 'Fetch & parse a shape for each journey leg?',
		type: 'boolean',
		default: false,
		parse: parseBoolean,
	},
	polylines: {
		description: 'Return information about available tickets?',
		type: 'boolean',
		default: false,
		parse: parseBoolean,
	},
	remarks: {
		description: 'Parse & return hints & warnings?',
		type: 'boolean',
		default: true,
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
	const refreshJourney = (req, res, next) => {
		const ref = req.params.ref.trim()

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'refreshJourney', req)

		hafas.refreshJourney(ref, opt)
		.then((journey) => {
			sendServerTiming(res, journey)
			res.allowCachingFor(60) // 1 minute
			res.json(journey)
			next()
		})
		.catch(next)
	}

	refreshJourney.pathParameters = {
		'ref': {type: 'string'},
	}
	refreshJourney.queryParameters = {
		...parsers,
	}
	return refreshJourney
}

module.exports = createRoute
