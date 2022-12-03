import path from 'path'
import {createClient as createHafas} from 'hafas-client'
import {profile as vbbProfile} from 'hafas-client/p/vbb/index.js'
import Redis from 'ioredis'
import {createCachedHafasClient as withCaching} from 'cached-hafas-client'
import {createRedisStore} from 'cached-hafas-client/stores/redis.js'

import {createHafasRestApi} from '../index.js'

// pro tip: pipe this script into `pino-pretty` to get nice logs

const config = {
	hostname: process.env.HOSTNAME || 'v5.vbb.transport.rest',
	name: 'vbb-rest',
	version: '5.0.0',
	description: 'An HTTP API for Berlin & Brandenburg public transport.',
	homepage: 'http://example.org/',
	docsLink: 'http://example.org/docs',
	openapiSpec: true,
	logging: true,
	aboutPage: true,
	healthCheck: async () => {
		const stop = await hafas.stop('900000100001')
		return !!stop
	}
}

const rawHafas = createHafas(vbbProfile, 'hafas-rest-api-example')

let hafas = rawHafas
if (process.env.REDIS_URL) {
	const opts = {}
	const url = new URL(process.env.REDIS_URL)
	opts.host = url.hostname || 'localhost'
	opts.port = url.port || '6379'
	if (url.password) opts.password = url.password
	if (url.pathname && url.pathname.length > 1) {
		opts.db = parseInt(url.pathname.slice(1))
	}
	const redis = new Redis(opts)
	hafas = withCaching(rawHafas, createRedisStore(redis))
}

const api = await createHafasRestApi(hafas, config, () => {})

const {logger} = api.locals
const port = process.env.PORT || 3000
api.listen(port, (err) => {
	if (err) {
		logger.error(err)
		process.exitCode = 1
	} else {
		logger.info(`listening on ${port} (${config.hostname}).`)
	}
})
