'use strict'

const {
	parseWhen,
	parseStop,
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

const createRoute = (hafas, config) => {
	const parsers = {
		when: parseWhen(hafas.profile.timezone),
		direction: parseStop,
		duration: parseInteger,
		results: parseInteger,
		linesOfStops: parseBoolean,
		remarks: parseBoolean,
		language: parseString
	}
	if (hafas.profile.departuresStbFltrEquiv !== false) {
		parsers.includeRelatedStations = parseBoolean
	}
	if (hafas.profile.departuresGetPasslist !== false) {
		parsers.stopovers = parseBoolean
	}

	const arrivals = (req, res, next) => {
		const id = parseStop('id', req.params.id)

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
