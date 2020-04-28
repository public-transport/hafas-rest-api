'use strict'

const {
	parseWhen,
	parseInteger,
	parseNumber,
	parseString,
	parseBoolean,
	parseQuery,
	parseProducts,
	parseLocation
} = require('../lib/parse')
const formatProductParams = require('../lib/format-product-parameters')

const WITHOUT_FROM_TO = {
	from: null,
	'from.id': null,
	'from.name': null,
	'from.latitude': null,
	'from.longitude': null,
	to: null,
	'to.id': null,
	'to.name': null,
	'to.latitude': null,
	'to.longitude': null,
}

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const parseWalkingSpeed = (key, val) => {
	if (!['slow', 'normal', 'fast'].includes(val)) {
		throw new Error(key + ' must be `slow`, `normal`, or `fast`')
	}
	return val
}

const createRoute = (hafas, config) => {
	const parsers = {
		departure: {
			description: 'Compute journeys departing at this date/time. Mutually exclusive with `arrival`.',
			type: 'date+time',
			defaultStr: '*now*',
			parse: parseWhen(hafas.profile.timezone),
		},
		arrival: {
			description: 'Compute journeys arriving at this date/time. Mutually exclusive with `departure`.',
			type: 'date+time',
			defaultStr: '*now*',
			parse: parseWhen(hafas.profile.timezone),
		},
		earlierThan: {
			description: 'Compute journeys "before" an `ealierRef`.',
			type: 'string',
			parse: parseString,
		},
		laterThan: {
			description: 'Compute journeys "after" an `laterRef`.',
			type: 'string',
			parse: parseString,
		},

		results: {
			description: 'Max. number of journeys.',
			type: 'number',
			default: 3,
			parse: parseInteger,
		},
		stopovers: {
			description: 'Fetch & parse stopovers on the way?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
		transfers: {
			description: 'Maximum number of transfers.',
			type: 'number',
			defaultStr: '*let HAFAS decide*',
			parse: parseInteger,
		},
		transferTime: {
			description: 'Minimum time in minutes for a single transfer.',
			type: 'number',
			default: 0,
			parse: parseNumber,
		},
		accessibility: {
			description: '`partial` or `complete`.',
			type: 'string',
			defaultStr: '*not accessible*',
			parse: parseString,
		},
		bike: {
			description: 'Compute only bike-friendly journeys?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
		startWithWalking: {
			description: 'Consider walking to nearby stations at the beginning of a journey?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		},
		walkingSpeed: {
			description: '`slow`, `normal` or `fast`.',
			type: 'string',
			default: 'normal',
			parse: parseWalkingSpeed,
		},
		tickets: {
			description: 'Return information about available tickets?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
		polylines: {
			description: 'Fetch & parse a shape for each journey leg?',
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
		scheduledDays: {
			description: 'Parse & return dates each journey is valid on?',
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

	const journeys = (req, res, next) => {
		const from = parseLocation(req.query, 'from')
		if (!from) return next(err400('Missing origin.'))
		const to = parseLocation(req.query, 'to')
		if (!to) return next(err400('Missing destination.'))

		const opt = parseQuery(parsers, req.query)
		const via = parseLocation(req.query, 'via')
		if (via) opt.via = via
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'journeys', req)

		hafas.journeys(from, to, opt)
		.then((data) => {
			res.setLinkHeader({
				prev: (data.earlierRef
					? req.searchWithNewParams({
						...WITHOUT_FROM_TO,
						departure: null, arrival: null,
						earlierThan: data.earlierRef,
					})
					: null
				),
				next: (data.laterRef
					? req.searchWithNewParams({
						...WITHOUT_FROM_TO,
						departure: null, arrival: null,
						laterThan: data.laterRef,
					})
					: null
				),
			})

			res.allowCachingFor(60) // 1 minute
			res.json(data)
			next()
		})
		.catch(next)
	}

	journeys.queryParameters = {
		'from': {docs: false},
		'from.id': {docs: false},
		'from.latitude': {docs: false}, 'from.longitude': {docs: false},
		'from.address': {docs: false},
		'from.name': {docs: false},

		'via': {docs: false},
		'via.id': {docs: false},
		'via.latitude': {docs: false}, 'via.longitude': {docs: false},
		'via.address': {docs: false},
		'via.name': {docs: false},

		'to': {docs: false},
		'to.id': {docs: false},
		'to.latitude': {docs: false}, 'to.longitude': {docs: false},
		'to.address': {docs: false},
		'to.name': {docs: false},

		...parsers,
		...formatProductParams(hafas.profile.products),
	}
	return journeys
}

module.exports = createRoute
