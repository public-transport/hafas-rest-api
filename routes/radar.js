'use strict'

const {
	parseInteger,
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
	results: {
		description: 'Max. number of vehicles.',
		type: 'integer',
		default: 256,
		parse: parseInteger,
	},
	duration: {
		description: 'Compute frames for the next `n` seconds.',
		type: 'integer',
		default: 30,
		parse: parseInteger,
	},
	frames: {
		description: 'Number of frames to compute.',
		type: 'integer',
		default: 3,
		parse: parseInteger,
	},
	polylines: {
		description: 'Fetch & parse a geographic shape for the movement of each vehicle?',
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
	const radar = (req, res, next) => {
		const q = req.query

		if (!q.north) return next(err400('Missing north latitude.'))
		if (!q.west) return next(err400('Missing west longitude.'))
		if (!q.south) return next(err400('Missing south latitude.'))
		if (!q.east) return next(err400('Missing east longitude.'))

		const opt = parseQuery(parsers, q)
		config.addHafasOpts(opt, 'radar', req)
		hafas.radar({north: +q.north, west: +q.west, south: +q.south, east: +q.east}, opt)
		.then((movements) => {
			sendServerTiming(res, movements)
			res.allowCachingFor(30) // 30 seconds
			res.json(movements)
			next()
		})
		.catch(next)
	}

	radar.queryParameters = {
		'north': {
			required: true,
			description: 'Northern latitude.',
			type: 'number',
			defaultStr: '–',
		},
		'west': {
			required: true,
			description: 'Western longitude.',
			type: 'number',
			defaultStr: '–',
		},
		'south': {
			required: true,
			description: 'Southern latitude.',
			type: 'number',
			defaultStr: '–',
		},
		'east': {
			required: true,
			description: 'Eastern longitude.',
			type: 'number',
			defaultStr: '–',
		},
		...parsers,
	}
	return radar
}

module.exports = createRoute
