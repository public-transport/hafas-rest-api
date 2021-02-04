'use strict'

const LinkHeader = require('http-link-header')

const openapiContentType = 'application/vnd.oai.openapi;version=3.0.3'

const generateSpec = (config, routes, logger = console) => {
	const spec = {
		openapi: '3.0.3',
		info: {
			title: config.name,
			description: config.description,
			contact: {
				url: config.homepage,
			},
			version: config.version,
		},
		paths: {},
	}
	if (config.docsLink) {
		spec.externalDocs = {
			description: 'human-readable docs',
			url: config.docsLink,
		}
	}

	for (const [path, route] of Object.entries(routes)) {
		if (!route.openapiPaths) {
			console.warn(`${path} does not expose \`route.openapiPaths\``)
			continue
		}
		// todo: detect conflicts?
		Object.assign(spec.paths, route.openapiPaths)
	}

	return JSON.stringify(spec)
}

// This follows the [.well-known service description draft](https://ioggstream.github.io/draft-polli-service-description-well-known-uri/draft-polli-service-description-well-known-uri.html).
const wellKnownPath = '/.well-known/service-desc'

const setOpenapiLink = (res) => {
	const existingLink = res.getHeader('Link')
	const header = existingLink ? LinkHeader.parse(existingLink) : new LinkHeader()
	header.set({
		rel: 'service-desc',
		uri: wellKnownPath,
		type: openapiContentType,
	})
	res.setHeader('Link', header.toString())
}

const serveOpenapiSpec = (api) => {
	const {config, logger} = api.locals
	const spec = generateSpec(config, api.routes, logger)

	api.get([
		wellKnownPath,
		'/openapi.json',
		'/swagger.json',
	], (req, res, next) => {
		res.set('content-type', openapiContentType)
		res.send(spec)
		next()
	})
}

module.exports = {
	setOpenapiLink,
	serveOpenapiSpec,
}
