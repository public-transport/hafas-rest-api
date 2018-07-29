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
		const ref = req.params.ref.trim()

		const lineName = req.query.lineName
		if (!lineName) return next(err400('Missing lineName.'))

		const opt = {}
		if ('when' in req.query) {
			const w = req.query.when
			opt.when = isNumber.test(w) ? new Date(w * 1000) : parseTime(w)
		}

		config.addHafasOpts(opt, 'trip', req)
		hafas.trip(ref, lineName, opt)
		.then((trip) => {
			res.json(trip)
			next()
		})
		.catch(next)
	}
	return trip
}

module.exports = createRoute
