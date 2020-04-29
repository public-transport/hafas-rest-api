'use strict'

const {
	parseWhen,
	parseStop,
	parseInteger,
	parseBoolean,
	parseString,
	parseQuery,
	parseProducts
} = require('../lib/parse')
const {
	formatWhen,
} = require('../lib/format')
const formatProductParams = require('../lib/format-product-parameters')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

// todo: DRY with routes/departures.js
const createRoute = (hafas, config) => {
	// todo: move to `hafas-client`
	const parsers = {
		when: {
			description: 'Date & time to get departures for.',
			type: 'date+time',
			defaultStr: '*now*',
			parse: parseWhen(hafas.profile.timezone),
		},
		direction: {
			description: 'Filter departures by direction.',
			type: 'string',
			parse: parseStop,
		},
		duration: {
			description: 'Show departures for how many minutes?',
			type: 'number',
			default: 10,
			parse: parseInteger,
		},
		results: {
			description: 'Max. number of departures.',
			type: 'number',
			defaultStr: '*whatever HAFAS wants*',
			parse: parseInteger,
		},
		linesOfStops: {
			description: 'Parse & return lines of each stop/station?',
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
	if (hafas.profile.departuresStbFltrEquiv !== false) {
		parsers.includeRelatedStations = {
			description: 'Fetch departures at related stops, e.g. those that belong together on the metro map?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		}
	}
	if (hafas.profile.departuresGetPasslist !== false) {
		parsers.stopovers = {
			description: 'Fetch & parse next stopovers of each departure?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		}
	}

	const linkHeader = (req, opt, arrivals) => {
		if (!opt.when || !Number.isInteger(opt.duration)) return {}
		const tNext = Date.parse(opt.when) - opt.duration * 60 * 1000
		const next = req.searchWithNewParams({
			when: formatWhen(tNext, hafas.profile.timezone),
		})
		return {next}
	}

	const arrivals = (req, res, next) => {
		const id = parseStop('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'arrivals', req)

		hafas.arrivals(id, opt)
		.then((arrs) => {
			res.setLinkHeader(linkHeader(req, opt, arrs))
			res.allowCachingFor(30) // 30 seconds
			res.json(arrs)
			next()
		})
		.catch(next)
	}

	arrivals.pathParameters = {
		'id': {
			description: 'stop/station ID to show arrivals for',
			type: 'number',
		},
	}
	arrivals.queryParameters = {
		...parsers,
		...formatProductParams(hafas.profile.products),
	}
	return arrivals
}

module.exports = createRoute
