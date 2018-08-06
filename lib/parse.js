'use strict'

const parseMessyTime = require('parse-messy-time')

const isNumber = /^\d+$/
const parseWhen = (key, val) => {
	if (isNumber.test(val)) return new Date(val * 1000)
	return parseMessyTime(key, val)
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

const IBNR = /^\d{5,}$/
const parseStation = (key, val) => {
	if (!IBNR.test(val)) throw new Error(key + ' must be an IBNR')
	return val
}

const parseLocation = (q, key) => {
	if (q[key]) return parseStation(key, q[key])
	if (q[key + '.latitude'] && q[key + '.longitude']) {
		const l = {
			type: 'location',
			latitude: +q[key + `.latitude`],
			longitude: +q[key + `.longitude`]
		}
		if (q[key + '.name']) l.name = q[key + '.name']
		if (q[key + '.id']) l.id = q[key + '.id']
		if (q[key + '.address']) l.address = q[key + '.address']
		return l
	}
	return null
}

const parseQuery = (parsers, query) => {
	const res = Object.create(null)

	for (const key of Object.keys(query)) {
		if (!Object.hasOwnProperty.call(parsers, key)) continue
		const parser = parsers[key]
		res[key] = parser(key, query[key])
	}

	return res
}

module.exports = {
	parseWhen,
	parseStation,
	parseNumber,
	parseInteger,
	parseString,
	parseBoolean,
	parseProducts,
	parseStation,
	parseLocation,
	parseQuery
}
