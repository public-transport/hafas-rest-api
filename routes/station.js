'use strict'

const {
	parseStation,
	parseBoolean,
	parseString,
	parseQuery
} = require('../lib/parse')

const parsers = {
	stationLines: parseBoolean,
	language: parseString
}

const createRoute = (hafas, config) => {
	const route = (req, res, next) => {
		if (res.headersSent) return next()

		const id = parseStation('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'station', req)

		hafas.station(id, opt)
		.then((station) => {
			res.json(station)
			next()
		})
		.catch(next)
	}
	return route
}

module.exports = createRoute
