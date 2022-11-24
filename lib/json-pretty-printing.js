import {parseBoolean} from './parse.js'

const configureJSONPrettyPrinting = (req, res) => {
	const spaces = req.query.pretty === 'false' ? undefined : '\t'
	req.app.set('json spaces', spaces)
}

const jsonPrettyPrintingOpenapiParam = {
	name: 'pretty',
	in: 'path',
	description: 'Pretty-print JSON responses?',
	schema: {type: 'boolean'},
}

const jsonPrettyPrintingParam = {
	description: 'Pretty-print JSON responses?',
	type: 'boolean',
	default: true,
	parse: parseBoolean,
}

export {
	configureJSONPrettyPrinting,
	jsonPrettyPrintingOpenapiParam,
	jsonPrettyPrintingParam,
}
