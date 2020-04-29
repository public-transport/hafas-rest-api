'use strict'

const {inspect} = require('util')

const generateRouteDoc = (path, route) => {
	let doc = ''

	const params = Object.entries(route.queryParameters || {})
	.filter(([_, spec]) => spec && spec.docs !== false)
	if (params.length > 0) {
		doc += `
parameter | description | type | default value
----------|-------------|------|--------------
`
		for (const [name, spec] of params) {
			let desc = spec.required ? '**Required.** ' : ''
			desc += spec.description || ''
			if (spec.type === 'date+time') {
				desc += ' See [date/time parameters](#datetime-parameters).'
			}

			let defaultStr = spec.defaultStr
			if (!defaultStr && ('default' in spec)) {
				defaultStr = typeof spec.default === 'string'
					? spec.default
					: inspect(spec.default)
				defaultStr = `\`${defaultStr}\``
			}

			doc += [
				`\`${name}\``,
				desc,
				spec.typeStr || spec.type,
				defaultStr || ' ',
			].join(' | ') + '\n'
		}
	}

	return doc
}

// todo: filter based on `routes`
const listOfRoutes = `\
## Routes

*Note:* These routes only wrap [\`hafas-client@5\` methods](https://github.com/public-transport/hafas-client/blob/5/docs/readme.md), check their docs for more details.

- [\`GET /locations\`](#get-locations)
- [\`GET /stops/nearby\`](#get-stopsnearby)
- [\`GET /stops/reachable-from\`](#get-stopsreachable-from)
- [\`GET /stops/:id\`](#get-stopsid)
- [\`GET /stops/:id/departures\`](#get-stopsiddepartures)
- [\`GET /stops/:id/arrivals\`](#get-stopsidarrivals)
- [\`GET /journeys\`](#get-journeys)
- [\`GET /journeys/:ref\`](#get-journeysref)
- [\`GET /trips/:id\`](#get-tripsid)
- [\`GET /radar\`](#get-radar)
- [date/time parameters](#datetime-parameters)
`

const tail = `\
## Date/Time Parameters

Possible formats:

- anything that [\`parse-human-relative-time\`](https://npmjs.com/package/parse-human-relative-time) can parse (e.g. \`tomorrow 2pm\`)
- [ISO 8601 date/time string](https://en.wikipedia.org/wiki/ISO_8601#Combined_date_and_time_representations) (e.g. \`2020-04-26T22:43+02:00\`)
- [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) (e.g. \`1587933780\`)
`

const generateApiDocs = (routes) => {
	const r = Object.create(null)
	for (const [path, route] of Object.entries(routes)) {
		r[path] = generateRouteDoc(path, route)
	}
	return {
		listOfRoutes,
		routes: r,
		tail,
	}
}

module.exports = generateApiDocs
