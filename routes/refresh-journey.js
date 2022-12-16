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

const createRefreshJourneyRoute = (hafas, config) => {
	const parsers = config.mapRouteParsers('refresh-journey', {
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
		remarks: {
			description: 'Parse & return hints & warnings?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		},
		scheduledDays: {
			description: 'Parse & return dates the journey is valid on?',
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

	const refreshJourney = (req, res, next) => {
		const ref = req.params.ref.trim()

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'refreshJourney', req)

		hafas.refreshJourney(ref, opt)
		.then((journeyRes) => {
			sendServerTiming(res, journeyRes)
			res.allowCachingFor(60) // 1 minute
			configureJSONPrettyPrinting(req, res)
			res.json(journeyRes)
			next()
		})
		.catch(next)
	}

	refreshJourney.openapiPaths = config.mapRouteOpenapiPaths('refresh-journey', {
		'/journeys/{ref}': {
			get: {
				summary: 'Fetches up-to-date realtime data for a journey computed before.',
				description: `\
Uses [\`hafasClient.refreshJourney()\`](https://github.com/public-transport/hafas-client/blob/6/docs/refresh-journey.md) to **"refresh" a journey, using its \`refreshToken\`**.

The journey will be the same (equal \`from\`, \`to\`, \`via\`, date/time & vehicles used), but you can get up-to-date realtime data, like delays & cancellations.`,
				externalDocs: {
					description: '`hafasClient.refreshJourney()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/6/docs/refresh-journey.md',
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
						description: 'The up-to-date journey, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/6/docs/refresh-journey.md).',
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

	refreshJourney.pathParameters = {
		'ref': {type: 'string'},
	}
	refreshJourney.queryParameters = {
		...parsers,
		'pretty': jsonPrettyPrintingParam,
	}
	return refreshJourney
}

export {
	createRefreshJourneyRoute,
}
