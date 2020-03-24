'use strict'

const {
	parseWhen,
	parseInteger,
	parseString,
	parseQuery,
	parseProducts
} = require('../lib/parse')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createRoute = (hafas, config) => {
	const parsers = {
		when: parseWhen(hafas.profile.timezone),
		maxTransfers: parseInteger,
		maxDuration: parseInteger,
		language: parseString,
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
			res.json(todo)
			next()
		})
		.catch(next)
	}
	return reachableFrom
}

module.exports = createRoute
