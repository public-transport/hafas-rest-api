'use strict'

const path = require('path')
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const serve = require('serve-static')

const createApi = require('..')

// pro tip: pipe this script into `pino-pretty` to get nice logs

const config = {
	hostname: process.env.HOSTNAME || '2.vbb.transport.rest',
	port: process.env.PORT || 3000,
	name: 'vbb-rest',
	description: 'An HTTP API for Berlin & Brandenburg public transport.',
	homepage: 'http://example.org/',
	docsLink: 'http://example.org/docs',
	logging: true,
	aboutPage: true,
	healthCheck: () => {
		return hafas.station('900000100001')
		.then((station) => !!station)
	}
}

const logosDir = path.dirname(require.resolve('vbb-logos/package.json'))

const hafas = createHafas(vbbProfile, 'hafas-rest-api-example')

const api = createApi(hafas, config, (api) => {
	api.use('/logos', serve(logosDir, {index: false}))
})

const {logger} = api.locals
api.listen(config.port, (err) => {
	if (err) {
		logger.error(err)
		process.exitCode = 1
	} else {
		logger.info(`Listening on ${config.hostname}:${config.port}.`)
	}
})
