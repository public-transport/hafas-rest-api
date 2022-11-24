import {
	parseBoolean,
} from '../lib/parse.js'

const formatProductParams = (products) => {
	const params = Object.create(null)
	for (const p of products) {
		let name = p.name
		if (p.short && p.short !== p.name) name += ` (${p.short})`
		params[p.id] = {
			description: `Include ${name}?`,
			type: 'boolean',
			default: p.default === true,
			parse: parseBoolean,
		}
	}
	return params
}

export {
	formatProductParams,
}
