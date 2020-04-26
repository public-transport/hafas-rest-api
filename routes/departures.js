'use strict'

const max = require('lodash/max')
const {
	parseWhen,
	parseStop,
	parseInteger,
	parseBoolean,
	parseString,
	parseQuery,
	parseProducts
} = require('../lib/parse')
const {
	formatWhen,
} = require('../lib/format')

const MINUTE = 60 * 1000

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

// todo: DRY with routes/arrivals.js
const createRoute = (hafas, config) => {
	const parsers = {
		when: parseWhen(hafas.profile.timezone),
		direction: parseStop,
		duration: parseInteger,
		results: parseInteger,
		linesOfStops: parseBoolean,
		remarks: parseBoolean,
		language: parseString
	}
	if (hafas.profile.departuresStbFltrEquiv !== false) {
		parsers.includeRelatedStations = parseBoolean
	}
	if (hafas.profile.departuresGetPasslist !== false) {
		parsers.stopovers = parseBoolean
	}

	const linkHeader = (req, opt, departures) => {
		let tNext = null
		if (opt.when && Number.isInteger(opt.duration)) {
			return Date.parse(opt.when) + opt.duration * MINUTE + MINUTE
		} else {
			const ts = departures
			.map(dep => Date.parse(dep.when || dep.plannedWhen))
			.filter(t => Number.isInteger(t))
			tNext = max(ts) + MINUTE
		}

		if (tNext === null) return {}
		const next = req.searchWithNewParams({
			when: formatWhen(tNext, hafas.profile.timezone),
		})
		return {next}
	}

	const departures = (req, res, next) => {
		const id = parseStop('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'departures', req)

		hafas.departures(id, opt)
		.then((deps) => {
			res.setLinkHeader(linkHeader(req, opt, deps))
			res.allowCachingFor(30) // 30 seconds
			res.json(deps)
			next()
		})
		.catch(next)
	}

	departures.pathParameters = [
		'id',
	]
	departures.queryParameters = [
		...hafas.profile.products.map(p => p.id),
		...Object.keys(parsers),
	]
	return departures
}

module.exports = createRoute
