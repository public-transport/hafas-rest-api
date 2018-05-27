'use strict'

const ibnr = /^\d{6,}$/g

const createRoute = (hafas, config) => {
	const route = (req, res, next) => {
		const id = req.params.id.trim()
		if (!ibnr.test(id)) return next()

		const opt = {}
		config.addHafasOpts(opt, 'location', req)
		hafas.location(id, opt)
		.then((station) => {
			res.json(station)
			next()
		})
		.catch(next)
	}
	return route
}

module.exports = createRoute
