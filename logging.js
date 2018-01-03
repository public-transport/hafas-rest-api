'use strict'

const shorthash = require('shorthash').unique
const morgan = require('morgan')

morgan.token('id', req => req.headers['x-identifier'] || shorthash(req.ip))

const loggingMiddleware = () => {
	return morgan(':date[iso] :id :method :url :status :response-time ms')
}

module.exports = loggingMiddleware
