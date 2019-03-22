'use strict'

const {stdSerializers} = require('pino')
const shorthash = require('shorthash').unique
const expressPino = require('express-pino-logger')

const reqSerializer = stdSerializers.req
const withoutRemoteAddress = (req) => {
	const log = reqSerializer(req)
	if (req.headers['x-identifier']) log.remoteAddress = req.headers['x-identifier']
	else if (log.remoteAddress) log.remoteAddress = shorthash(log.remoteAddress)
	return log
}

const serializers = Object.assign({}, stdSerializers, {req: withoutRemoteAddress})

const createLoggingMiddleware = logger => expressPino({logger, serializers})

module.exports = createLoggingMiddleware
