'use strict'

const {
	parseBoolean,
	parseString,
	parseQuery
} = require('../lib/parse')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const parsers = {
	stopovers: parseBoolean,
	remarks: parseBoolean,
	polyline: parseBoolean,
	language: parseString
}

const createRoute = (hafas, config) => {
	const trip = (req, res, next) => {
		const id = req.params.id.trim()

		const lineName = req.query.lineName
		if (!lineName) return next(err400('Missing lineName.'))

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'trip', req)

		hafas.trip(id, lineName, opt)
		.then((trip) => {
			res.json(trip)
			next()
		})
		.catch(next)
	}
	return trip
}

module.exports = createRoute
