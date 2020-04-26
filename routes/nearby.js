'use strict'

const {
	parseInteger,
	parseNumber,
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
	results: parseInteger,
	distance: parseNumber,
	stops: parseBoolean,
	poi: parseBoolean,
	linesOfStops: parseBoolean,
	language: parseString
}

const createRoute = (hafas, config) => {
	const nearby = (req, res, next) => {
		if (!req.query.latitude) return next(err400('Missing latitude.'))
		if (!req.query.longitude) return next(err400('Missing longitude.'))

		const opt = parseQuery(parsers, req.query)
		config.addHafasOpts(opt, 'nearby', req)

		hafas.nearby({
			type: 'location',
			latitude: +req.query.latitude,
			longitude: +req.query.longitude
		}, opt)
		.then((nearby) => {
			res.allowCachingFor(5 * 60) // 5 minutes
			res.json(nearby)
			next()
		})
		.catch(next)
	}

	nearby.queryParameters = [
		...Object.keys(parsers),
		'latitude', 'longitude',
	]
	return nearby
}

module.exports = createRoute
