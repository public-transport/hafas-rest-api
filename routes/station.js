'use strict'

const parse  = require('cli-native').to

const ibnr = /^\d{6,}$/g

const createRoute = (hafas, config) => {
	const route = (req, res, next) => {
		const id = req.params.id.trim()
		if (!ibnr.test(id)) return next()

		const opt = {}
		if ('stationLines' in req.query) {
			opt.stationLines = parse(req.query.stationLines)
		}
		if ('language' in req.query) opt.language = req.query.language

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
