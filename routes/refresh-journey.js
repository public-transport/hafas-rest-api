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
	tickets: parseBoolean,
	polylines: parseBoolean,
	remarks: parseBoolean,
	language: parseString
}

const createRoute = (hafas, config) => {
	const refreshJourney = (req, res, next) => {
		const ref = req.params.ref.trim()

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'refreshJourney', req)

		hafas.refreshJourney(ref, opt)
		.then((journey) => {
			res.json(journey)
			next()
		})
		.catch(next)
	}
	return refreshJourney
}

module.exports = createRoute
