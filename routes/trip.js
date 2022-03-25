'use strict'

const {
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
			sendServerTiming(res, trip)
			res.allowCachingFor(30) // 30 seconds
			configureJSONPrettyPrinting(req, res)
			res.json(trip)
			next()
		})
		.catch(next)
	}

	trip.openapiPaths = {
		'/trips/{id}': {
			get: {
				summary: 'Fetches a trip by ID.',
				description: `\
Uses [\`hafasClient.trip()\`](https://github.com/public-transport/hafas-client/blob/5/docs/trip.md) to **fetch a trip by ID**.`,
				externalDocs: {
					description: '`hafasClient.trip()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/5/docs/trip.md',
				},
				parameters: [
					{
						name: 'id',
						in: 'path',
						description: 'trip ID',
						required: true,
						schema: {type: 'string'},
						// todo: examples?
					},
					{
						name: 'lineName',
						in: 'query',
						description: 'the trip\'s line name',
						required: true,
						schema: {type: 'string'},
						// todo: examples?
					},
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'The trip, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/5/docs/trip.md).',
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
		'pretty': jsonPrettyPrintingParam,
	}
	return trip
}

module.exports = createRoute
