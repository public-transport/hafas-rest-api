import max from 'lodash/max.js'
import {
	parseWhen,
	parseStop,
	parseInteger,
	parseBoolean,
	parseString,
	parseQuery,
	parseProducts
} from '../lib/parse.js'
import {
	formatWhen,
} from '../lib/format.js'
import {snapWhenToSteps} from '../lib/snap-when.js'
import {sendServerTiming} from '../lib/server-timing.js'
import {
	configureJSONPrettyPrinting,
	jsonPrettyPrintingOpenapiParam,
	jsonPrettyPrintingParam,
} from '../lib/json-pretty-printing.js'
import {formatParsersAsOpenapiParams} from '../lib/format-parsers-as-openapi.js'
import {formatProductParams} from '../lib/format-product-parameters.js'

const MINUTE = 60 * 1000

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

// todo: DRY with routes/arrivals.js
const createDeparturesRoute = (hafas, config) => {
	// todo: move to `hafas-client`
	const _parsers = {
		when: {
			description: 'Date & time to get departures for.',
			type: 'date+time',
			defaultStr: '*now, with 10s accuracy*',
			parse: parseWhen(hafas.profile.timezone),
		},
		direction: {
			description: 'Filter departures by direction.',
			type: 'string',
			parse: parseStop,
		},
		duration: {
			description: 'Show departures for how many minutes?',
			type: 'integer',
			default: 10,
			parse: parseInteger,
		},
		results: {
			description: 'Max. number of departures.',
			type: 'integer',
			defaultStr: '*whatever HAFAS wants',
			parse: parseInteger,
		},
		linesOfStops: {
			description: 'Parse & return lines of each stop/station?',
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
	if (hafas.profile.departuresStbFltrEquiv !== false) {
		_parsers.includeRelatedStations = {
			description: 'Fetch departures at related stops, e.g. those that belong together on the metro map?',
			type: 'boolean',
			default: true,
			parse: parseBoolean,
		}
	}
	if (hafas.profile.departuresGetPasslist !== false) {
		_parsers.stopovers = {
			description: 'Fetch & parse next stopovers of each departure?',
			type: 'boolean',
			default: false,
			parse: parseBoolean,
		}
	}
	const parsers = config.mapRouteParsers('departures', _parsers)

	const linkHeader = (req, opt, departures) => {
		let tNext = null
		if (opt.when && Number.isInteger(opt.duration)) {
			tNext = Date.parse(opt.when) + opt.duration * MINUTE + MINUTE
		} else {
			const ts = departures
			.map(dep => Date.parse(dep.when || dep.plannedWhen))
			.filter(t => Number.isInteger(t))
			tNext = max(ts) + MINUTE
		}

		if (tNext === null) return {}
		const next = req.searchWithNewParams({
			when: formatWhen(tNext, hafas.profile.timezone),
		})
		return {next}
	}

	const departures = (req, res, next) => {
		const id = parseStop('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		if (!('when' in opt)) {
			opt.when = snapWhenToSteps()
		}

		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'departures', req)

		hafas.departures(id, opt)
		.then((depsRes) => {
			sendServerTiming(res, depsRes)
			res.setLinkHeader(linkHeader(req, opt, depsRes.departures))
			// todo: send res.realtimeDataUpdatedAt as Last-Modified?
			res.allowCachingFor(30) // 30 seconds
			configureJSONPrettyPrinting(req, res)
			res.json(depsRes)
			next()
		})
		.catch(next)
	}

	departures.openapiPaths = config.mapRouteOpenapiPaths('departures', {
		'/stops/{id}/departures': {
			get: {
				summary: 'Fetches departures at a stop/station.',
				description: `\
Uses [\`hafasClient.departures()\`](https://github.com/public-transport/hafas-client/blob/6/docs/departures.md) to **query departures at a stop/station**.`,
				externalDocs: {
					description: '`hafasClient.departures()` documentation',
					url: 'https://github.com/public-transport/hafas-client/blob/6/docs/departures.md',
				},
				parameters: [
					{
						name: 'id',
						in: 'path',
						description: 'stop/station ID to show departures for',
						required: true,
						schema: {type: 'string'},
						// todo: examples?
					},
					...formatParsersAsOpenapiParams(parsers),
					jsonPrettyPrintingOpenapiParam,
				],
				responses: {
					'2XX': {
						description: 'An object with an array of departures, in the [`hafas-client` format](https://github.com/public-transport/hafas-client/blob/6/docs/departures.md).',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										departures: {
											type: 'array',
											items: {type: 'object'}, // todo
										},
										realtimeDataUpdatedAt: {
											type: 'integer',
										},
									},
									required: [
										'departures',
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

	departures.pathParameters = {
		'id': {
			description: 'stop/station ID to show departures for',
			type: 'number',
		},
	}
	departures.queryParameters = {
		...parsers,
		...formatProductParams(hafas.profile.products),
		'pretty': jsonPrettyPrintingParam,
	}
	return departures
}

export {
	createDeparturesRoute,
}
