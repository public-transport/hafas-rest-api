'use strict'

const {
	parseStop,
	parseBoolean,
	parseString,
	parseQuery
} = require('../lib/parse')

const parsers = {
	linesOfStops: parseBoolean,
	language: parseString
}

const createRoute = (hafas, config) => {
	const stop = (req, res, next) => {
		if (res.headersSent) return next()

		const id = parseStop('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'stop', req)

		hafas.stop(id, opt)
		.then((stop) => {
			res.json(stop)
			next()
		})
		.catch(next)
	}

	stop.pathParameters = [
		'id',
	]
	stop.queryParameters = [
		...Object.keys(parsers),
	]
	return stop
}

module.exports = createRoute
