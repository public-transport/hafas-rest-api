import {inspect} from 'util'
import Slugger from 'github-slugger'

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

const tail = `\
## Date/Time Parameters

Possible formats:

- anything that [\`parse-human-relative-time\`](https://npmjs.com/package/parse-human-relative-time) can parse (e.g. \`tomorrow 2pm\`)
- [ISO 8601 date/time string](https://en.wikipedia.org/wiki/ISO_8601#Combined_date_and_time_representations) (e.g. \`2020-04-26T22:43+02:00\`)
- [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) (e.g. \`1587933780\`)
`

const slugger = new Slugger()
const generateApiDocs = (routes) => {
	const r = Object.create(null)
	let listOfRoutes = `\
## Routes

*Note:* These routes only wrap [\`hafas-client@6\` methods](https://github.com/public-transport/hafas-client/blob/6/docs/api.md), check their docs for more details.

`

	for (const [path, route] of Object.entries(routes)) {
		r[path] = generateRouteDoc(path, route)
		const spec = `GET ${path}`
		listOfRoutes += `
- [\`${spec}\`](#${slugger.slug(spec)})`
	}

	listOfRoutes += `
- [date/time parameters](#datetime-parameters)
`

	return {
		listOfRoutes,
		routes: r,
		tail,
	}
}

export {
	generateApiDocs,
}
