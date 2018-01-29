'use strict'

const createRoute = (hafas, config) => {
	const route = (req, res, next) => {
		const id = req.params.id.trim()

		hafas.location(id)
		.then((station) => {
			res.json(station)
			next()
		})
		.catch(next)
	}
	return route
}

module.exports = createRoute
