'use strict'

const parse = require('cli-native').to

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const createRoute = (hafas, config) => {
	const radar = (req, res, next) => {
		const q = req.query

		if (!q.north) return next(err400('Missing north latitude.'))
		if (!q.west) return next(err400('Missing west longitude.'))
		if (!q.south) return next(err400('Missing south latitude.'))
		if (!q.east) return next(err400('Missing east longitude.'))

		const opt = {}
		if ('results' in q) opt.results = parseInt(q.results)
		if ('duration' in q) opt.duration = parseInt(q.duration)
		if ('frames' in q) opt.frames = parseInt(q.frames)

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
