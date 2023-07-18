import {hostname as osHostname} from 'node:os'
import express from 'express'
import compression from 'compression'
import hsts from 'hsts'
import pino from 'pino'
import createCors from 'cors'
import onHeaders from 'on-headers'
import {getAllRoutes as getRoutes} from './routes/index.js'
import {routeUriTemplate} from './lib/route-uri-template.js'
import {formatLinkHeader as linkHeader} from './lib/link-header.js'
import {setOpenapiLink, serveOpenapiSpec} from './lib/openapi-spec.js'

const REQ_START_TIME = Symbol.for('request-start-time')

const defaultConfig = {
	hostname: osHostname(),
	cors: true,
	etags: 'weak',
	csp: `default-src 'none'`,
	handleErrors: true,
	openapiSpec: false,
	aboutPage: true,
	logging: false,
	healthCheck: null,
	mapRouteParsers: (route, parsers) => parsers,
	mapRouteOpenapiPaths: (route, openapiPaths) => openapiPaths,
	addHafasOpts: () => {},
	modifyRoutes: routes => routes,
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

const createHafasRestApi = async (hafas, config, attachMiddleware) => {
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
	if ('function' !== typeof config.mapRouteParsers) {
		throw new Error('cfg.mapRouteParsers must be a function')
	}
	if ('function' !== typeof config.mapRouteOpenapiPaths) {
		throw new Error('cfg.mapRouteOpenapiPaths must be a function')
	}

	const api = express()
	api.locals.config = config
	api.locals.logger = pino({
		redact: {
			paths: [
				'err.request', 'err.response',
			],
			remove: true,
		},
	})

	if (config.cors) {
		const cors = createCors({
			exposedHeaders: '*',
			maxAge: 24 * 60 * 60, // 1 day
		})
		api.options('*', cors)
		api.use(cors)
	}
	api.set('etag', config.etags)
	if (config.logging) {
		const {
			createLoggingMiddleware: createLogging,
		} = await import('./logging.js')
		api.use(createLogging(api.locals.logger))
	}
	api.use(compression())
	api.use(hsts({
		maxAge: 10 * 24 * 60 * 60
	}))
	api.use((req, res, next) => {
		res.setLinkHeader = (linkSpec) => {
			const link = linkHeader(res.getHeader('Link'), linkSpec)
			res.setHeader('Link', link)
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

		res.serverTiming = Object.create(null)
		res[REQ_START_TIME] = process.hrtime()
		onHeaders(res, () => {
			const t = Object.entries(res.serverTiming)
			const dt = process.hrtime(res[REQ_START_TIME])
			t.push(['total', Math.round(dt[0] * 1e3 + dt[1] / 1e6)])
			const h = t.map(([name, dur]) => name + ';dur=' + dur).join(', ')
			res.setHeader('server-timing', h)
		})

		if (!res.headersSent) {
			// https://helmetjs.github.io/docs/dont-sniff-mimetype/
			res.setHeader('X-Content-Type-Options', 'nosniff')
			res.setHeader('content-security-policy', config.csp)
			res.setHeader('X-Powered-By', [
				config.name, config.version, config.homepage
			].filter(str => !!str).join(' '))
			if (config.version) res.setHeader('X-API-Version', config.version)

			if (config.openapiSpec) setOpenapiLink(res)
		}
		next()
	})

	if (attachMiddleware) attachMiddleware(api)

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

	if (config.aboutPage) {
		const {
			createAboutPageRoute: aboutPage,
		} = await import('./about-page.js')
		api.get('/', aboutPage(config.name, config.description, config.docsLink))
	}
	if (config.docsAsMarkdown) {
		const {
			createDocsRoute: docs,
		} = await import('./docs.js')
		api.get('/docs', docs(config))
	}

	const _routes = await getRoutes(hafas, config)
	const routes = config.modifyRoutes(_routes, hafas, config)
	api.routes = routes
	for (const [path, route] of Object.entries(routes)) {
		api.get(path, route)
	}

	if (config.openapiSpec) serveOpenapiSpec(api)

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
		const {
			createErrorHandler: handleErrors,
		} = await import('./handle-errors.js')
		api.use(handleErrors(api.locals.logger))
	}

	return api
}

export {
	createHafasRestApi,
}
