import {
	parseWhen,
	parseInteger,
	parseString,
	parseQuery,
	parseProducts
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

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createReachableFromRoute = (hafas, config) => {
	const parsers = config.mapRouteParsers('reachable-from', {
		when: {
			description: 'Date & time to compute the reachability for.',
			type: 'date+time',
			defaultStr: '*now, with 10s accuracy*',
			parse: parseWhen(hafas.profile.timezone),
		},
		maxTransfers: {
			description: 'Maximum number of transfers.',
			type: 'integer',
			default: 5,
			parse: parseInteger,
		},
		maxDuration: {
			description: 'Maximum travel duration, in minutes.',
			type: 'integer',
			defaultStr: '*infinite*',
			parse: parseInteger,
		},
		language: {
			description: 'Language of the results.',
			type: 'string',
			default: 'en',
			parse: parseString,
		},
	})

	const reachableFrom = (req, res, next) => {
		if (!req.query.latitude) return next(err400('Missing latitude.'))
		if (!req.query.longitude) return next(err400('Missing longitude.'))
		if (!req.query.address) return next(err400('Missing address.'))

		const opt = parseQuery(parsers, req.query)
		opt.products = parseProducts(hafas.profile.products, req.query)
		if (!('when' in opt)) {
			opt.when = snapWhenToSteps()
		}
		config.addHafasOpts(opt, 'reachableFrom', req)

		hafas.reachableFrom({
			type: 'location',
			latitude: +req.query.latitude,
			longitude: +req.query.longitude,
			address: req.query.address,
		}, opt)
		.then((reachable) => {
			sendServerTiming(res, reachable)
			res.allowCachingFor(60) // 1 minute
			configureJSONPrettyPrinting(req, res)
			res.json(reachable)
			next()
		})
		.catch(next)
	}

	reachableFrom.openapiPaths = config.mapRouteOpenapiPaths('reachable-from', {
		'/stops/reachable-from': {
			get: {
				summary: 'Finds stops/stations reachable within a certain time from an address.',
				description: `\
Uses [\`hafasClient.reachableFrom()\`](https://github.com/public-transport/hafas-client/blob/6/docs/reachable-from.md) to **find stops/stations reachable within a certain time from an address**.`,
				externalDocs: {
					description: '`hafasClient.reachableFrom()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/6/docs/reachable-from.md',
				},
				parameters: [
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'An object with an array of stops/stations, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/6/docs/reachable-from.md).',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										reachable: {
											type: 'array',
											items: {type: 'object'}, // todo
										},
										realtimeDataUpdatedAt: {
											type: 'integer',
										},
									},
									required: [
										'reachable',
									],
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

	reachableFrom.queryParameters = {
		'latitude': {
			required: true,
			type: 'number',
			defaultStr: '–',
		},
		'longitude': {
			required: true,
			type: 'number',
			defaultStr: '–',
		},
		'address': {
			required: true,
			type: 'string',
			defaultStr: '–',
		},
		...parsers,
		...formatProductParams(hafas.profile.products),
		'pretty': jsonPrettyPrintingParam,
	}
	return reachableFrom
}

export {
	createReachableFromRoute,
}
