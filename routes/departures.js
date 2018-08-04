'use strict'

const parseWhen = require('parse-messy-time')
const parse = require('cli-native').to

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
				opt.when = parseWhen(req.query.when)
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
		if ('stationLines' in req.query) {
			opt.stationLines = parse(req.query.stationLines)
		}
		if ('remarks' in req.query) {
			opt.remarks = parse(req.query.remarks)
		}
		if ('includeRelatedStations' in req.query) {
			opt.includeRelatedStations = parse(req.query.includeRelatedStations)
		}
		if ('language' in req.query) opt.language = req.query.language

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
