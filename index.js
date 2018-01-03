'use strict'

const express = require('express')
const compression = require('compression')
const nocache = require('nocache')
const hsts = require('hsts')

const createCors = require('./cors')
const nearby = require('./lib/nearby')
const departures = require('./lib/departures')
const journeys = require('./lib/journeys')
const locations = require('./lib/locations')
const handleErrors = require('./handle-errors')

const createApi = (hafas, config) => {
	let journeyPart = null
	if (hafas.profile.journeyPart) journeyPart = require('./lib/journey-part')
	let radar = null
	if (hafas.profile.radar) radar = require('./lib/radar')

	const api = express()

	api.use(createCors(['User-Agent', 'X-Identifier']))
	api.use(compression())
	api.use(hsts({
		maxAge: 10 * 24 * 60 * 60 * 1000
	}))
	api.use((req, res, next) => {
		if (!res.headersSent) {
			res.setHeader('X-Powered-By', config.name + ' ' + config.homepage)
		}
		next()
	})

	const noCache = nocache()
	api.get('/stations/nearby', nearby(hafas, config))
	api.get('/stations/:id/departures', noCache, departures(hafas, config))
	api.get('/journeys', noCache, journeys(hafas, config))
	if (journeyPart) {
		api.get('/journeys/parts/:ref', noCache, journeyPart(hafas, config))
	}
	api.get('/locations', locations(hafas, config))
	if (radar) {
		api.get('/radar', noCache, radar(hafas, config))
	}

	api.use(handleErrors)

	return api
}

module.exports = createApi
