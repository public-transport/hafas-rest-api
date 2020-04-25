'use strict'

const {
	parseWhen,
	parseInteger,
	parseNumber,
	parseString,
	parseBoolean,
	parseQuery,
	parseProducts,
	parseLocation
} = require('../lib/parse')

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

const parseWalkingSpeed = (key, val) => {
	if (!['slow', 'normal', 'fast'].includes(val)) {
		throw new Error(key + ' must be `slow`, `normal`, or `fast`')
	}
	return val
}

const createRoute = (hafas, config) => {
	const parsers = {
		departure: parseWhen(hafas.profile.timezone),
		arrival: parseWhen(hafas.profile.timezone),
		earlierThan: parseString,
		laterThan: parseString,

		results: parseInteger,
		stopovers: parseBoolean,
		transfers: parseInteger,
		transferTime: parseNumber,
		accessibility: parseString,
		bike: parseBoolean,
		tickets: parseBoolean,
		polylines: parseBoolean,
		remarks: parseBoolean,
		walkingSpeed: parseWalkingSpeed,
		startWithWalking: parseBoolean,
		scheduledDays: parseBoolean,
		language: parseString
	}

	const journeys = (req, res, next) => {
		const from = parseLocation(req.query, 'from')
		if (!from) return next(err400('Missing origin.'))
		const to = parseLocation(req.query, 'to')
		if (!to) return next(err400('Missing destination.'))

		const opt = parseQuery(parsers, req.query)
		const via = parseLocation(req.query, 'via')
		if (via) opt.via = via
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'journeys', req)

		hafas.journeys(from, to, opt)
		.then((data) => {
			res.setLinkHeader({
				prev: (data.earlierRef
					? req.searchWithNewParams({
						departure: null, arrival: null,
						earlierThan: data.earlierRef,
					})
					: null
				),
				next: (data.laterRef
					? req.searchWithNewParams({
						departure: null, arrival: null,
						laterThan: data.laterRef,
					})
					: null
				),
			})

			res.json(data)
			next()
		})
		.catch(next)
	}

	journeys.cache = false
	journeys.queryParameters = [
		...hafas.profile.products.map(p => p.id),
		...Object.keys(parsers),
		'from', 'from.id', 'from.latitude', 'from.longitude', 'from.address', 'from.name',
		'via', 'via.id', 'via.latitude', 'via.longitude', 'via.address', 'via.name',
		'to', 'to.id', 'to.latitude', 'to.longitude', 'to.address', 'to.name',
	]
	return journeys
}

module.exports = createRoute
