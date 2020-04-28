'use strict'

const {
	parseWhen,
	parseInteger,
	parseString,
	parseQuery,
	parseProducts
} = require('../lib/parse')
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
			type: 'number',
			default: 5,
			parse: parseInteger,
		},
		maxDuration: {
			description: 'Maximum travel duration, in minutes.',
			type: 'number',
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
		.then((todo) => {
			res.allowCachingFor(60) // 1 minute
			res.json(todo)
			next()
		})
		.catch(next)
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
	}
	return reachableFrom
}

module.exports = createRoute
