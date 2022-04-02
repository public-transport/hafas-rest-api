'use strict'

const {
	parseInteger,
	parseBoolean,
	parseString,
	parseQuery
} = require('../lib/parse')
const sendServerTiming = require('../lib/server-timing')
const {
	configureJSONPrettyPrinting,
	jsonPrettyPrintingOpenapiParam,
	jsonPrettyPrintingParam,
} = require('../lib/json-pretty-printing')
const formatParsersAsOpenapiParams = require('../lib/format-parsers-as-openapi')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createRoute = (hafas, config) => {
	const parsers = {
		fuzzy: {
			description: 'Find more than exact matches?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		},
		results: {
			description: 'How many stations shall be shown?',
			type: 'integer',
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

	const locations = (req, res, next) => {
		if (!req.query.query) return next(err400('Missing query.'))

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'locations', req)

		hafas.locations(req.query.query, opt)
		.then((locations) => {
			sendServerTiming(res, locations)
			res.allowCachingFor(5 * 60) // 5 minutes
			configureJSONPrettyPrinting(req, res)
			res.json(locations)
			next()
		})
		.catch(next)
	}

	locations.openapiPaths = {
		'/locations': {
			get: {
				summary: 'Finds stops/stations, POIs and addresses matching a query.',
				description: `\
Uses [\`hafasClient.locations()\`](https://github.com/public-transport/hafas-client/blob/5/docs/locations.md) to **find stops/stations, POIs and addresses matching \`query\`**.`,
				externalDocs: {
					description: '`hafasClient.locations()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/5/docs/locations.md',
				},
				parameters: [
					{
						name: 'query',
						in: 'query',
						description: 'The term to search for.',
						required: true,
						schema: {type: 'string'},
						// todo: examples?
					},
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'An array of locations, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/5/docs/locations.md).',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									items: {type: 'object'}, // todo
								},
								// todo: example(s)
							},
						},
						// todo: links
					},
					// todo: non-2xx response
				},
			},
		},
	}

	locations.queryParameters = {
		'query': {
			required: true,
			type: 'string',
			defaultStr: '–',
		},
		...parsers,
		'pretty': jsonPrettyPrintingParam,
	}
	return locations
}

module.exports = createRoute
