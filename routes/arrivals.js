'use strict'

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

const err400 = (msg) => {
	const err = new Error(msg)
	err.statusCode = 400
	return err
}

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

	const linkHeader = (req, opt, arrivals) => {
		if (!opt.when || !Number.isInteger(opt.duration)) return {}
		const tNext = Date.parse(opt.when) - opt.duration * 60 * 1000
		const next = req.searchWithNewParams({
			when: formatWhen(tNext, hafas.profile.timezone),
		})
		return {next}
	}

	const arrivals = (req, res, next) => {
		const id = parseStop('id', req.params.id)

		const opt = parseQuery(parsers, req.query)
		opt.products = parseProducts(hafas.profile.products, req.query)
		config.addHafasOpts(opt, 'arrivals', req)

		hafas.arrivals(id, opt)
		.then((arrs) => {
			res.setLinkHeader(linkHeader(req, opt, arrs))
			res.json(arrs)
			next()
		})
		.catch(next)
	}

	arrivals.cache = false
	arrivals.pathParameters = [
		'id',
	]
	arrivals.queryParameters = [
		...hafas.profile.products.map(p => p.id),
		...Object.keys(parsers),
	]
	return arrivals
}

module.exports = createRoute
