'use strict'

const express = require('express')
const corser = require('corser')
const compression = require('compression')
const nocache = require('nocache')

const nearby = require('./lib/nearby')
const departures = require('./lib/departures')
const journeys = require('./lib/journeys')
const locations = require('./lib/locations')

const headers = corser.simpleRequestHeaders.concat(['User-Agent', 'X-Identifier'])

const handleErrors = (err, req, res, next) => {
	if (process.env.NODE_ENV === 'dev') console.error(err)
	if (res.headersSent) return next()

	let msg = err.message, code = null
	if (err.isHafasError) {
		msg = 'VBB error: ' + msg
		code = 502
	}
	res.status(code || 500).json({error: true, msg})
	next()
}

const createApi = (hafas, config) => {
	let journeyPart = null
	if (hafas.profile.journeyPart) journeyPart = require('./lib/journey-part')
	let radar = null
	if (hafas.profile.radar) radar = require('./lib/radar')

	const api = express()

	api.use(corser.create({requestHeaders: headers})) // CORS
	api.use(compression())
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
	if (radar) api.get('/radar', noCache, radar(hafas, config))

	api.use(handleErrors)

	return api
}

module.exports = createApi
