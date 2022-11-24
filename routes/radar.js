import {
	parseInteger,
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

const createRadarRoute = (hafas, config) => {
	const parsers = config.mapRouteParsers('radar', {
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
	})

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
			configureJSONPrettyPrinting(req, res)
			res.json(movements)
			next()
		})
		.catch(next)
	}

	radar.openapiPaths = config.mapRouteOpenapiPaths('radar', {
		'/radar': {
			get: {
				summary: 'Finds all vehicles currently in an area.',
				description: `\
Uses [\`hafasClient.radar()\`](https://github.com/public-transport/hafas-client/blob/5/docs/radar.md) to **find all vehicles currently in an area**, as well as their movements.`,
				externalDocs: {
					description: '`hafasClient.radar()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/5/docs/radar.md',
				},
				parameters: [
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'An array of movements, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/5/docs/radar.md).',
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
	})

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
		'pretty': jsonPrettyPrintingParam,
	}
	return radar
}

export {
	createRadarRoute,
}
