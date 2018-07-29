'use strict'

const express = require('express')
const compression = require('compression')
const nocache = require('nocache')
const hsts = require('hsts')

const nearby = require('./routes/nearby')
const station = require('./routes/station')
const departures = require('./routes/departures')
const journeys = require('./routes/journeys')
const locations = require('./routes/locations')

const defaultConfig = {
	cors: true,
	handleErrors: true,
	aboutPage: true,
	addHafasOpts: () => {}
}

const createApi = (hafas, config, attachMiddleware) => {
	config = Object.assign({}, defaultConfig, config)

	const api = express()

	if (config.cors) {
		const createCors = require('./cors')
		api.use(createCors(['User-Agent', 'X-Identifier']))
	}
	if (config.logging) {
		const createLogging = require('./logging')
		api.use(createLogging())
	}
	api.use(compression())
	api.use(hsts({
		maxAge: 10 * 24 * 60 * 60
	}))
	api.use((req, res, next) => {
		if (!res.headersSent) {
			res.setHeader('X-Powered-By', config.name + ' ' + config.homepage)
		}
		next()
	})
	if (config.aboutPage) {
		const aboutPage = require('./about-page')
		api.get('/', aboutPage(config.name, config.description, config.docsLink))
	}

	attachMiddleware(api)

	const noCache = nocache()
	api.get('/stations/nearby', nearby(hafas, config))
	api.get('/stations/:id', station(hafas, config))
	api.get('/stations/:id/departures', noCache, departures(hafas, config))
	api.get('/journeys', noCache, journeys(hafas, config))
	if (hafas.profile.trip) {
		const trip = require('./routes/trip')
		api.get('/journeys/legs/:ref', noCache, trip(hafas, config))
	}
	api.get('/locations', locations(hafas, config))
	if (hafas.profile.radar) {
		const radar = require('./routes/radar')
		api.get('/radar', noCache, radar(hafas, config))
	}

	if (config.handleErrors) {
		const handleErrors = require('./handle-errors')
		api.use(handleErrors)
	}

	return api
}

module.exports = createApi
