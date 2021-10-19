'use strict'

const {
	parseWhen,
	parseInteger,
	parseString,
	parseQuery,
	parseProducts
} = require('../lib/parse')
const sendServerTiming = require('../lib/server-timing')
const {
	configureJSONPrettyPrinting,
	jsonPrettyPrintingOpenapiParam,
	jsonPrettyPrintingParam,
} = require('../lib/json-pretty-printing')
const formatParsersAsOpenapiParams = require('../lib/format-parsers-as-openapi')
const formatProductParams = require('../lib/format-product-parameters')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createRoute = (hafas, config) => {
	const parsers = {
		when: {
			description: 'Date & time to compute the reachability for.',
			type: 'date+time',
			defaultStr: '*now*',
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
	}

	const reachableFrom = (req, res, next) => {
		if (!req.query.latitude) return next(err400('Missing latitude.'))
		if (!req.query.longitude) return next(err400('Missing longitude.'))
		if (!req.query.address) return next(err400('Missing address.'))

		const opt = parseQuery(parsers, req.query)
		opt.products = parseProducts(hafas.profile.products, req.query)
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

	reachableFrom.openapiPaths = {
		'/stops/reachable-from': {
			get: {
				summary: 'Finds stops/stations reachable within a certain time from an address.',
				description: `\
Uses [\`hafasClient.reachableFrom()\`](https://github.com/public-transport/hafas-client/blob/5/docs/reachable-from.md) to **find stops/stations reachable within a certain time from an address**.`,
				externalDocs: {
					description: '`hafasClient.reachableFrom()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/5/docs/reachable-from.md',
				},
				parameters: [
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'An array of stops/stations, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/5/docs/reachable-from.md).',
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

module.exports = createRoute
