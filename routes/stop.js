import {
	parseStop,
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

const createStopRoute = (hafas, config) => {
	const parsers = config.mapRouteParsers('stop', {
		linesOfStops: {
			description: 'Parse & expose lines at each stop/station?',
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

	const stop = (req, res, next) => {
		if (res.headersSent) return next()

		const id = parseStop('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'stop', req)

		hafas.stop(id, opt)
		.then((stop) => {
			sendServerTiming(res, stop)
			res.allowCachingFor(5 * 60) // 5 minutes
			configureJSONPrettyPrinting(req, res)
			res.json(stop)
			next()
		})
		.catch(next)
	}

	stop.openapiPaths = config.mapRouteOpenapiPaths('stop', {
		'/stops/{id}': {
			get: {
				summary: 'Finds a stop/station by ID.',
				description: `\
Uses [\`hafasClient.stop()\`](https://github.com/public-transport/hafas-client/blob/6/docs/stop.md) to **find a stop/station by ID**.`,
				externalDocs: {
					description: '`hafasClient.stop()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/6/docs/stop.md',
				},
				parameters: [
					{
						name: 'id',
						in: 'path',
						description: 'stop/station ID',
						required: true,
						schema: {type: 'string'},
						// todo: examples?
					},
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'The stop, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/6/docs/stop.md).',
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

	stop.pathParameters = {
		'id': {
			description: 'stop/station ID',
			type: 'string',
		},
	}
	stop.queryParameters = {
		...parsers,
		'pretty': jsonPrettyPrintingParam,
	}
	return stop
}

export {
	createStopRoute,
}
