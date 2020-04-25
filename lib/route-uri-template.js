'use strict'

const {strictEqual} = require('assert')

const routeUriTemplate = (basePath, route) => {
	let tpl = basePath
	if (Array.isArray(route.pathParameters)) {
		for (const p of route.pathParameters) {
			tpl = tpl.replace('/:' + p, `{/${p}}`)
		}
	}
	if (
		Array.isArray(route.queryParameters) &&
		route.queryParameters.length > 0
	) {
		const ps = route.queryParameters.map(p => encodeURIComponent(p))
		tpl += `{?${ps.join(',')}}`
	}
	return tpl
}

strictEqual(routeUriTemplate('/stops/:id', {
	pathParameters: ['id'],
	queryParameters: ['foo', 'bar']
}), '/stops{/id}{?foo,bar}')

module.exports = routeUriTemplate
