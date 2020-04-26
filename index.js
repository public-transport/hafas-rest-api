'use strict'

const express = require('express')
const compression = require('compression')
const hsts = require('hsts')
const pino = require('pino')
const createCors = require('cors')
const getRoutes = require('./routes')
const routeUriTemplate = require('./lib/route-uri-template')
const linkHeader = require('./lib/link-header')

const defaultConfig = {
	cors: true,
	etags: 'weak',
	handleErrors: true,
	aboutPage: true,
	logging: false,
	healthCheck: null,
	events: false,
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
	api.locals.logger = pino({
		level: process.env.LOGGING_LEVEL || 'info'
	})

	if (config.cors) {
		const cors = createCors()
		api.options('*', cors)
		api.use(cors)
	}
	api.set('etag', config.etags)
	if (config.logging) {
		const createLogging = require('./logging')
		api.use(createLogging(api.locals.logger))
	}
	api.use(compression())
	api.use(hsts({
		maxAge: 10 * 24 * 60 * 60
	}))
	api.use((req, res, next) => {
		res.setLinkHeader = (linkSpec) => {
			res.setHeader('Link', linkHeader(linkSpec))
		}
		req.searchWithNewParams = (newParams) => {
			const u = new URL(req.url, 'http://example.org')
			for (const [name, val] of Object.entries(newParams)) {
				if (val === null) u.searchParams.delete(name)
				else u.searchParams.set(name, val)
			}
			return u.search
		}
		res.allowCachingFor = (sec) => {
			if (!Number.isInteger(sec)) {
				throw new Error('sec is invalid')
			}

			// Allow clients to use the cache when re-fetching fails
			// for another `sec` seconds after expiry.
			res.setHeader('cache-control', `public, max-age: ${sec}, s-maxage: ${sec}, stale-if-error=${sec}`)
			// Allow CDNs to cache for another `sec` seconds while
			// they're re-fetching the latest copy.
			res.setHeader('surrogate-control', `stale-while-revalidate=${sec}`)
		}

		if (!res.headersSent) {
			// https://helmetjs.github.io/docs/dont-sniff-mimetype/
			res.setHeader('X-Content-Type-Options', 'nosniff')
			res.setHeader('content-security-policy', `default-src 'none'`)
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

	if (config.healthCheck) {
		api.get('/health', (req, res, next) => {
			res.setHeader('cache-control', 'no-store')
			res.setHeader('expires', '0')
			try {
				config.healthCheck()
				.then((isHealthy) => {
					if (isHealthy === true) {
						res.status(200)
						res.json({ok: true})
					} else {
						res.status(502)
						res.json({ok: false})
					}
				}, next)
			} catch (err) {
				next(err)
			}
		})
	}

	const routes = getRoutes(hafas, config)
	for (const [path, route] of Object.entries(routes)) {
		api.get(path, route)
	}

	const rootLinks = {}
	for (const [path, route] of Object.entries(routes)) {
		rootLinks[route.name + 'Url'] = routeUriTemplate(path, route)
	}
	api.get('/', (req, res, next) => {
		if (!req.accepts('json')) return next()
		if (res.headersSent) return next()
		res.json(rootLinks)
	})

	if (config.handleErrors) {
		const handleErrors = require('./handle-errors')
		api.use(handleErrors(api.locals.logger))
	}

	return api
}

module.exports = createApi
