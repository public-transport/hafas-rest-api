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
		default: false,
		parse: parseBoolean,
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
			configureJSONPrettyPrinting(req, res)
			res.json(journey)
			next()
		})
		.catch(next)
	}

	refreshJourney.openapiPaths = {
		'/journeys/{ref}/arrivals': {
			get: {
				summary: 'Fetches up-to-date realtime data for a journey computed before.',
				description: `\
Uses [\`hafasClient.refreshJourney()\`](https://github.com/public-transport/hafas-client/blob/5/docs/refresh-journey.md) to **"refresh" a journey, using its \`refreshToken\`**.

The journey will be the same (equal \`from\`, \`to\`, \`via\`, date/time & vehicles used), but you can get up-to-date realtime data, like delays & cancellations.`,
				externalDocs: {
					description: '`hafasClient.refreshJourney()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/5/docs/refresh-journey.md',
				},
				parameters: [
					{
						name: 'ref',
						in: 'path',
						description: 'The journey\'s `refreshToken`.',
						required: true,
						schema: {type: 'string'},
						// todo: examples?
					},
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'The up-to-date journey, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/5/docs/refresh-journey.md).',
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

	refreshJourney.pathParameters = {
		'ref': {type: 'string'},
	}
	refreshJourney.queryParameters = {
		...parsers,
		'pretty': jsonPrettyPrintingParam,
	}
	return refreshJourney
}

module.exports = createRoute
