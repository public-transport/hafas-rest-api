'use strict'

const express = require('express')
const compression = require('compression')
const nocache = require('nocache')
const hsts = require('hsts')
const pino = require('pino')

const nearby = require('./routes/nearby')
const stop = require('./routes/stop')
const departures = require('./routes/departures')
const arrivals = require('./routes/arrivals')
const journeys = require('./routes/journeys')
const locations = require('./routes/locations')

const defaultConfig = {
	cors: true,
	handleErrors: true,
	aboutPage: true,
	logging: false,
	healthCheck: null,
	addHafasOpts: () => {}
}

const assertNonEmptyString = (cfg, key) => {
	if ('string' !== typeof cfg[key]) {
		throw new Error(`config.${key} must be a string`)
	}
	if (!cfg[key]) throw new Error(`config.${key} must not be empty`)
}
const assertBoolean = (cfg, key) => {
	if ('boolean' !== typeof cfg[key]) {
		throw new Error(`config.${key} must be a boolean`)
	}
}

const createApi = (hafas, config, attachMiddleware) => {
	config = Object.assign({}, defaultConfig, config)
	// mandatory
	assertNonEmptyString(config, 'hostname')
	if ('number' !== typeof config.port) throw new Error('cfg.port must be a number')
	assertNonEmptyString(config, 'name')
	// optional
	if ('cors' in config) assertBoolean(config, 'cors')
	if ('handleErrors' in config) assertBoolean(config, 'handleErrors')
	if ('logging' in config) assertBoolean(config, 'logging')
	if (config.healthCheck !== null && 'function' !== typeof config.healthCheck) {
		throw new Error('cfg.healthCheck must be a function')
	}
	if ('version' in config) assertNonEmptyString(config, 'version')
	if ('homepage' in config) assertNonEmptyString(config, 'homepage')
	if ('aboutPage' in config) assertBoolean(config, 'aboutPage')
	if ('description' in config) assertNonEmptyString(config, 'description')
	if ('docsLink' in config) assertNonEmptyString(config, 'docsLink')

	const api = express()
	api.locals.logger = pino()

	if (config.cors) {
		const createCors = require('./cors')
		const cors = createCors()
		api.options('*', cors)
		api.use(cors)
	}
	if (config.logging) {
		const createLogging = require('./logging')
		api.use(createLogging(api.locals.logger))
	}
	api.use(compression())
	api.use(hsts({
		maxAge: 10 * 24 * 60 * 60
	}))
	api.use((req, res, next) => {
		if (!res.headersSent) {
			res.setHeader('X-Powered-By', [
				config.name, config.version, config.homepage
			].filter(str => !!str).join(' '))
			if (config.version) res.setHeader('X-API-Version', config.version)
		}
		next()
	})
	if (config.aboutPage) {
		const aboutPage = require('./about-page')
		api.get('/', aboutPage(config.name, config.description, config.docsLink))
	}
	if (config.docsAsMarkdown) {
		const docs = require('./docs')
		api.get('/docs', docs(config))
	}

	attachMiddleware(api)
	const noCache = nocache()

	if (config.healthCheck) {
		api.get('/health', noCache, (req, res, next) => {
			try {
				config.healthCheck()
				.then((isHealthy) => {
					if (isHealthy === true) {
						res.status(200)
						res.json({ok: true})
					} else {
						res.status(503)
						res.json({ok: false})
					}
				}, next)
			} catch (err) {
				next(err)
			}
		})
	}

	api.get('/stops/nearby', nearby(hafas, config))
	api.get('/stops/:id', stop(hafas, config))
	api.get('/stations/:id/departures', noCache, departures(hafas, config))
	api.get('/stations/:id/arrivals', noCache, arrivals(hafas, config))
	api.get('/journeys', noCache, journeys(hafas, config))
	if (hafas.profile.trip) {
		const trip = require('./routes/trip')
		api.get('/trips/:id', noCache, trip(hafas, config))
	}
	api.get('/locations', locations(hafas, config))
	if (hafas.profile.radar) {
		const radar = require('./routes/radar')
		api.get('/radar', noCache, radar(hafas, config))
	}
	if (hafas.profile.refreshJourney) {
		const refreshJourney = require('./routes/refresh-journey')
		api.get('/journeys/:ref', noCache, refreshJourney(hafas, config))
	}

	if (config.handleErrors) {
		const handleErrors = require('./handle-errors')
		api.use(handleErrors(api.locals.logger))
	}

	return api
}

module.exports = createApi
