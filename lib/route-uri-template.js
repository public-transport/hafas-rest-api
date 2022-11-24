import {strictEqual} from 'assert'

const routeUriTemplate = (basePath, route) => {
	let tpl = basePath
	if (route.pathParameters) {
		for (const p of Object.keys(route.pathParameters)) {
			tpl = tpl.replace('/:' + p, `{/${p}}`)
		}
	}
	if (
		route.queryParameters
	) {
		const ps = Object.keys(route.queryParameters)
		.map(p => encodeURIComponent(p))
		if (ps.length > 0) tpl += `{?${ps.join(',')}}`
	}
	return tpl
}

strictEqual(routeUriTemplate('/stops/:id', {
	pathParameters: {
		'id': {description: 'id'},
	},
	queryParameters: {
		'foo': {description: 'foo'},
		'bar': {description: 'bar'},
	}
}), '/stops{/id}{?foo,bar}')

export {
	routeUriTemplate,
}
