import omit from 'lodash/omit.js'
import {
	parseWhen,
	parseStop,
	parseBoolean,
	parseString,
	parseArrayOfStrings,
	parseQuery,
	parseProducts,
} from '../lib/parse.js'
import {snapWhenToSteps} from '../lib/snap-when.js'
import {sendServerTiming} from '../lib/server-timing.js'
import {
	configureJSONPrettyPrinting,
	jsonPrettyPrintingOpenapiParam,
	jsonPrettyPrintingParam,
} from '../lib/json-pretty-printing.js'
import {formatParsersAsOpenapiParams} from '../lib/format-parsers-as-openapi.js'
import {formatProductParams} from '../lib/format-product-parameters.js'

// const MINUTE = 60 * 1000

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createTripsRoute = (hafas, config) => {
	// todo: move to `hafas-client`
	const _parsers = {
		query: {
			description: 'line name or Fahrtnummer',
			type: 'string',
			default: '*',
			parse: parseString,
		},
		when: {
			description: 'Date & time to get trips for.',
			type: 'date+time',
			defaultStr: '*now, with 10s accuracy*',
			parse: parseWhen(hafas.profile.timezone),
		},
		fromWhen: {
			description: 'Together with untilWhen, forms a time frame to get trips for. Mutually exclusive with `when`.',
			type: 'date+time',
			defaultStr: '*now, with 10s accuracy*',
			parse: parseWhen(hafas.profile.timezone),
		},
		untilWhen: {
			description: 'Together with fromWhen, forms a time frame to get trips for. Mutually exclusive with `when`.',
			type: 'date+time',
			defaultStr: '–',
			parse: parseWhen(hafas.profile.timezone),
		},
		onlyCurrentlyRunning: {
			description: 'Only return trips that run within the specified time frame.',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		},
		currentlyStoppingAt: {
			description: 'Only return trips that stop at the specified stop within the specified time frame.',
			type: 'string',
			parse: parseStop,
		},
		lineName: {
			description: 'Only return trips with the specified line name.',
			type: 'string',
			parse: parseString,
		},
		operatorNames: {
			description: 'Only return trips operated by operators specified by their names, separated by commas.',
			type: 'string',
			parse: parseArrayOfStrings,
		},
		stopovers: {
			description: 'Fetch & parse stopovers of each trip?',
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
		subStops: {
			description: 'Parse & return sub-stops of stations?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		},
		entrances: {
			description: 'Parse & return entrances of stops/stations?',
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
	const parsers = config.mapRouteParsers('trips', _parsers)

	const tripsRoute = (req, res, next) => {
		const _parsedQuery = parseQuery(parsers, req.query)
		const query = 'query' in _parsedQuery ? _parsedQuery.query : '*'

		const opt = omit(_parsedQuery, ['query'])
		opt.products = parseProducts(hafas.profile.products, req.query)
		if (!('when' in opt) && !('fromWhen' in opt) && !('untilWhen' in opt)) {
			res.redirect(307, req.searchWithNewParams({
				when: snapWhenToSteps() / 1000 | 0,
			}))
			return next()
		}
		config.addHafasOpts(opt, 'tripsByName', req)

		hafas.tripsByName(_parsedQuery.query, opt)
		.then((tripsRes) => {
			sendServerTiming(res, tripsRes)
			// todo: send res.realtimeDataUpdatedAt as Last-Modified?
			// todo: appropriate cache time?
			res.allowCachingFor(30) // 30 seconds
			configureJSONPrettyPrinting(req, res)
			res.json(tripsRes)
			next()
		})
		.catch(next)
	}

	tripsRoute.openapiPaths = config.mapRouteOpenapiPaths('trips', {
		'/trips': {
			get: {
				summary: 'Fetches all trips within a specified time frame (default: *now*) that match certain criteria.',
				description: `\
Uses [\`hafasClient.tripsByName()\`](https://github.com/public-transport/hafas-client/blob/6/docs/trips-by-name.md) to query trips.`,
				externalDocs: {
					description: '`hafasClient.tripsByName()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/6/docs/trips-by-name.md',
				},
				parameters: [
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'An object with a list of trips, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/6/docs/trips-by-name.md).',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										trips: {
											type: 'array',
											items: {type: 'object'}, // todo
										},
										realtimeDataUpdatedAt: {
											type: 'integer',
										},
									},
									required: [
										'trips',
									],
								},
								// todo: example(s)
							},
						},
					},
					// todo: non-2xx response
				},
			},
		},
	})

	tripsRoute.queryParameters = {
		...parsers,
		...formatProductParams(hafas.profile.products),
		'pretty': jsonPrettyPrintingParam,
	}
	return tripsRoute
}

export {
	createTripsRoute,
}
