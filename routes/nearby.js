'use strict'

const {
	parseInteger,
	parseNumber,
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
	const parsers = config.mapRouteParsers('nearby', {
		results: {
			description: 'maximum number of results',
			type: 'integer',
			default: 8,
			parse: parseInteger,
		},
		distance: {
			description: 'maximum walking distance in meters',
			type: 'integer',
			defaultStr: '–',
			parse: parseNumber,
		},
		stops: {
			description: 'Return stops/stations?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		},
		poi: {
			description: 'Return points of interest?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		},
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

	const nearby = (req, res, next) => {
		if (!req.query.latitude) return next(err400('Missing latitude.'))
		if (!req.query.longitude) return next(err400('Missing longitude.'))

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'nearby', req)

		hafas.nearby({
			type: 'location',
			latitude: +req.query.latitude,
			longitude: +req.query.longitude
		}, opt)
		.then((nearby) => {
			sendServerTiming(res, nearby)
			res.allowCachingFor(5 * 60) // 5 minutes
			configureJSONPrettyPrinting(req, res)
			res.json(nearby)
			next()
		})
		.catch(next)
	}

	nearby.openapiPaths = config.mapRouteOpenapiPaths('nearby', {
		'/locations/nearby': {
			get: {
				summary: 'Finds stops/stations & POIs close to a geolocation.',
				description: `\
Uses [\`hafasClient.nearby()\`](https://github.com/public-transport/hafas-client/blob/5/docs/nearby.md) to **find stops/stations & POIs close to the given geolocation**.`,
				externalDocs: {
					description: '`hafasClient.nearby()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/5/docs/nearby.md',
				},
				parameters: [
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'An array of locations, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/5/docs/nearby.md).',
						content: {
							'application/json': {
								schema: {
									'type': 'array',
									'items': {
										'anyOf': [
											{
												'$ref': '#/components/schemas/Location'
											},
											{
												'$ref': '#/components/schemas/Station'
											},
											{
												'$ref': '#/components/schemas/Stop'
											}
										]
									}
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

	nearby.queryParameters = {
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
		...parsers,
		'pretty': jsonPrettyPrintingParam,
	}
	return nearby
}

module.exports = createRoute
