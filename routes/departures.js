'use strict'

const parse = require('parse-messy-time')

const isNumber = /^\d+$/

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createRoute = (hafas, config) => {
	const departures = (req, res, next) => {
		const id = req.params.id.trim()

		const opt = {}

		if ('when' in req.query) {
			if (isNumber.exec(req.query.when)) {
				opt.when = new Date(req.query.when * 1000)
			} else {
				opt.when = parse(req.query.when)
			}
		}
		if ('direction' in req.query) {
			const dir = req.query.direction
			if (!isNumber.exec(dir)) {
				return next(err400('Invalid direction parameter.'))
			}
			opt.direction = dir
		}
		if ('duration' in req.query) {
			const dur = parseInt(req.query.duration)
			if (Number.isNaN(dur)) {
				return next(err400('Invalid duration parameter.'))
			}
			opt.duration = dur
		}

		config.addHafasOpts(opt, 'departures', req)
		hafas.departures(id, opt)
		.then((deps) => {
			res.json(deps)
			next()
		})
		.catch(next)
	}
	return departures
}

module.exports = createRoute
