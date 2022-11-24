const formatParameterParsersAsOpenapiParameters = (paramsParsers) => {
	return Object.entries(paramsParsers)
	.map(([name, _]) => {
		const res = {
			name,
			in: 'query',
			description: _.description,
		}
		if (_.type) {
			res.schema = {
				type: _.type,
			}
			if (_.type === 'date+time') {
				res.schema.type = 'string'
				res.schema.format = 'date-time'
			}
			if ('default' in _) res.schema.default = _.default
			if (_.enum) res.schema.enum = _.enum
		}
		if (!('default' in _) && _.defaultStr) {
			res.description += ` – Default: ${_.defaultStr}`
		}
		return res
	})
}

export {
	formatParameterParsersAsOpenapiParameters as formatParsersAsOpenapiParams,
}
