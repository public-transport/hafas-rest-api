'use strict'

const {
	parseInteger,
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
	duration: parseInteger,
	frames: parseInteger,
	polylines: parseBoolean,
	language: parseString
}

const createRoute = (hafas, config) => {
	const radar = (req, res, next) => {
		const q = req.query

		if (!q.north) return next(err400('Missing north latitude.'))
		if (!q.west) return next(err400('Missing west longitude.'))
		if (!q.south) return next(err400('Missing south latitude.'))
		if (!q.east) return next(err400('Missing east longitude.'))

		const opt = parseQuery(parsers, q)
		config.addHafasOpts(opt, 'radar', req)
		hafas.radar({north: +q.north, west: +q.west, south: +q.south, east: +q.east}, opt)
		.then((movements) => {
			res.json(movements)
			next()
		})
		.catch(next)
	}
	return radar
}

module.exports = createRoute
