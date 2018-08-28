'use strict'

const {
	parseWhen,
	parseStation,
	parseInteger,
	parseBoolean,
	parseString,
	parseQuery,
	parseProducts
} = require('../lib/parse')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const parsers = {
	when: parseWhen,
	direction: parseStation,
	duration: parseInteger,
	stationLines: parseBoolean,
	remarks: parseBoolean,
	includeRelatedStations: parseBoolean,
	language: parseString
}

const createRoute = (hafas, config) => {
	const arrivals = (req, res, next) => {
		const id = parseStation('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'arrivals', req)

		hafas.arrivals(id, opt)
		.then((arrs) => {
			res.json(arrs)
			next()
		})
		.catch(next)
	}
	return arrivals
}

module.exports = createRoute
