'use strict'

const {
	parseInteger,
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
	fuzzy: {
		description: 'Find more than exact matches?',
		type: 'boolean',
		default: true,
		parse: parseBoolean,
	},
	results: {
		description: 'How many stations shall be shown?',
		type: 'number',
		default: 10,
		parse: parseInteger,
	},
	stops: {
		description: 'Show stops/stations?',
		type: 'boolean',
		default: true,
		parse: parseBoolean,
	},
	addresses: {
		description: 'Show points of interest?',
		type: 'boolean',
		default: true,
		parse: parseBoolean,
	},
	poi: {
		description: 'Show addresses?',
		type: 'boolean',
		default: true,
		parse: parseBoolean,
	},
	linesOfStops: {
		description: 'Parse & return lines of each stop/station?',
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
	const locations = (req, res, next) => {
		if (!req.query.query) return next(err400('Missing query.'))

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'locations', req)

		hafas.locations(req.query.query, opt)
		.then((locations) => {
			res.allowCachingFor(5 * 60) // 5 minutes
			res.json(locations)
			next()
		})
		.catch(next)
	}

	locations.queryParameters = {
		'query': {
			required: true,
			type: 'string',
			defaultStr: '–',
		},
		...parsers,
	}
	return locations
}

module.exports = createRoute
