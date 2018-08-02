'use strict'

const parseTime = require('parse-messy-time')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const isNumber = /^\d+$/

const createRoute = (hafas, config) => {
	const trip = (req, res, next) => {
		const id = req.params.id.trim()

		const lineName = req.query.lineName
		if (!lineName) return next(err400('Missing lineName.'))

		const opt = {}
		if ('stopovers' in req.query) {
			opt.stopovers = parse(req.query.stopovers)
		}
		if ('remarks' in req.query) {
			opt.remarks = parse(req.query.remarks)
		}
		if ('polyline' in req.query) {
			opt.polyline = parse(req.query.polyline)
		}

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
