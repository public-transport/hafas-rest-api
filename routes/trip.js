'use strict'

const {
	parseBoolean,
	parseString,
	parseQuery
} = require('../lib/parse')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const parsers = {
	stopovers: {
		description: 'Fetch & parse stopovers on the way?',
		type: 'boolean',
		default: true,
		parse: parseBoolean,
	},
	remarks: {
		description: 'Parse & return hints & warnings?',
		type: 'boolean',
		default: true,
		parse: parseBoolean,
	},
	polyline: {
		description: 'Fetch & parse the geographic shape of the trip?',
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
	const trip = (req, res, next) => {
		const id = req.params.id.trim()

		const lineName = req.query.lineName
		if (!lineName) return next(err400('Missing lineName.'))

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'trip', req)

		hafas.trip(id, lineName, opt)
		.then((trip) => {
			res.allowCachingFor(30) // 30 seconds
			res.json(trip)
			next()
		})
		.catch(next)
	}

	trip.pathParameters = {
		'id': {
			description: 'trip ID',
			type: 'string',
		},
	}
	trip.queryParameters = {
		'lineName': {
			required: true,
			description: 'Line name of the part\'s mode of transport, e.g. `RE7`.',
			type: 'string',
			defaultStr: '–',
		},
		...parsers,
	}
	return trip
}

module.exports = createRoute
