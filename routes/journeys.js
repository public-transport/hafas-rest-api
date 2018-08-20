'use strict'

const {
	parseWhen,
	parseInteger,
	parseNumber,
	parseString,
	parseBoolean,
	parseQuery,
	parseProducts,
	parseLocation
} = require('../lib/parse')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const parsers = {
	departure: parseWhen,
	arrival: parseWhen,
	earlierThan: parseString,
	laterThan: parseString,

	results: parseInteger,
	stopovers: parseBoolean,
	transfers: parseInteger,
	transferTime: parseNumber,
	accessibility: parseString,
	bike: parseBoolean,
	tickets: parseBoolean,
	polylines: parseBoolean,
	remarks: parseBoolean,
	startWithWalking: parseBoolean,
	language: parseString
}

const createRoute = (hafas, config) => {
	const journeys = (req, res, next) => {
		const from = parseLocation(req.query, 'from')
		if (!from) return next(err400('Missing origin.'))
		const to = parseLocation(req.query, 'to')
		if (!to) return next(err400('Missing destination.'))

		const opt = parseQuery(parsers, req.query)
		const via = parseLocation(req.query, 'via')
		if (via) opt.via = via
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'journeys', req)

		hafas.journeys(from, to, opt)
		.then((journeys) => {
			res.json(journeys)
			next()
		})
		.catch(next)
	}
	return journeys
}

module.exports = createRoute
