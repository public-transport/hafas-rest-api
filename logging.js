import {stdSerializers} from 'pino'
import _shorthash from 'shorthash'
const {unique: shorthash} = _shorthash
import pinoHttp from 'pino-http'

const reqSerializer = stdSerializers.req
const withoutRemoteAddress = (req) => {
	const log = reqSerializer(req)
	if (req.headers['x-identifier']) log.remoteAddress = req.headers['x-identifier']
	else if (log.remoteAddress) log.remoteAddress = shorthash(log.remoteAddress)
	return log
}

const serializers = Object.assign({}, stdSerializers, {req: withoutRemoteAddress})

const createLoggingMiddleware = logger => pinoHttp({logger, serializers})

export {
	createLoggingMiddleware,
}
