import {DateTime} from 'luxon'
import _parseHumanRelativeTime from 'parse-human-relative-time'
const parseHumanRelativeTime = _parseHumanRelativeTime(DateTime)

const isNumber = /^\d+$/
const parseWhen = (tz = null) => (key, val) => {
	if (isNumber.test(val)) return new Date(val * 1000)
	const d = new Date(val)
	if (Number.isInteger(+d)) return d

	const dt = DateTime.fromMillis(Date.now(), {zone: tz})
	return parseHumanRelativeTime(val, dt).toJSDate()
}

const parseNumber = (key, val) => {
	const res = +val
	if (Number.isNaN(res)) throw new Error(key + ' must be a number')
	return res
}
const parseInteger = (key, val) => {
	const res = parseInt(val, 10)
	if (Number.isNaN(res)) throw new Error(key + ' must be a number')
	return res
}

const parseString = (key, val) => {
	if ('string' !== typeof val) throw new Error(key + ' must be a string')
	return val.trim()
}

const parseArrayOfStrings = (key, val) => {
	if ('string' !== typeof val) throw new Error(key + ' must be a string')
	return val.split(',').map((str, i) => parseString(`${key}[${i}]`, str))
}

const parseBoolean = (key, val) => {
	val = val && val.toLowerCase()
	if (val === 'true') return true
	if (val === 'false') return false
	throw new Error(key + ' must be a boolean')
}

const parseProducts = (products, query) => {
	const res = Object.create(null)

	for (let info of products) {
		const p = info.id
		if (Object.hasOwnProperty.call(query, p)) {
			res[p] = parseBoolean(p, query[p])
		}
	}

	return res
}

const IBNR = /^\d{2,}$/
const parseStop = (key, val) => {
	if (!IBNR.test(val)) throw new Error(key + ' must be an IBNR')
	return val
}

const parseLocation = (q, key) => {
	if (q[key]) return parseStop(key, q[key])
	if (q[key + '.latitude'] && q[key + '.longitude']) {
		const l = {
			type: 'location',
			latitude: +q[key + `.latitude`],
			longitude: +q[key + `.longitude`]
		}
		if (q[key + '.name']) l.name = q[key + '.name']
		if (q[key + '.id']) {
			l.id = q[key + '.id']
			l.poi = true
		} else if (q[key + '.address']) {
			l.address = q[key + '.address']
		}
		return l
	}
	return null
}

const parseQuery = (params, query) => {
	const res = Object.create(null)

	for (const [key, param] of Object.entries(params)) {
		if ('default' in param) res[key] = param.default
	}
	for (const key of Object.keys(query)) {
		if (!Object.hasOwnProperty.call(params, key)) continue
		const {parse} = params[key]
		res[key] = parse(key, query[key])
	}

	return res
}

export {
	parseWhen,
	parseStop,
	parseNumber,
	parseInteger,
	parseString,
	parseArrayOfStrings,
	parseBoolean,
	parseProducts,
	parseLocation,
	parseQuery
}
