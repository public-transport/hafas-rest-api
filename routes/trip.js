import {
	parseBoolean,
	parseString,
	parseQuery
} from '../lib/parse.js'
import {sendServerTiming} from '../lib/server-timing.js'
import {
	configureJSONPrettyPrinting,
	jsonPrettyPrintingOpenapiParam,
	jsonPrettyPrintingParam,
} from '../lib/json-pretty-printing.js'
import {formatParsersAsOpenapiParams} from '../lib/format-parsers-as-openapi.js'

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createTripRoute = (hafas, config) => {
	const parsers = config.mapRouteParsers('trip', {
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
	})

	const trip = (req, res, next) => {
		const id = req.params.id.trim()

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'trip', req)

		hafas.trip(id, opt)
		.then((tripRes) => {
			sendServerTiming(res, tripRes)
			res.allowCachingFor(30) // 30 seconds
			configureJSONPrettyPrinting(req, res)
			res.json(tripRes)
			next()
		})
		.catch(next)
	}

	trip.openapiPaths = config.mapRouteOpenapiPaths('trip', {
		'/trips/{id}': {
			get: {
				summary: 'Fetches a trip by ID.',
				description: `\
Uses [\`hafasClient.trip()\`](https://github.com/public-transport/hafas-client/blob/6/docs/trip.md) to **fetch a trip by ID**.`,
				externalDocs: {
					description: '`hafasClient.trip()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/6/docs/trip.md',
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
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'The trip, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/6/docs/trip.md).',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									// todo
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
	})

	trip.pathParameters = {
		'id': {
			description: 'trip ID',
			type: 'string',
		},
	}
	trip.queryParameters = {
		...parsers,
		'pretty': jsonPrettyPrintingParam,
	}
	return trip
}

export {
	createTripRoute,
}
