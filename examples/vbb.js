'use strict'

const path = require('path')
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const serve = require('serve-static')

const createApi = require('..')

// pro tip: pipe this script into `pino-pretty` to get nice logs

const config = {
	hostname: process.env.HOSTNAME || '2.vbb.transport.rest',
	name: 'vbb-rest',
	description: 'An HTTP API for Berlin & Brandenburg public transport.',
	homepage: 'http://example.org/',
	docsLink: 'http://example.org/docs',
	logging: true,
	aboutPage: true,
	healthCheck: () => {
		return hafas.stop('900000100001')
		.then((stop) => !!stop)
	}
}

const logosDir = path.dirname(require.resolve('vbb-logos/package.json'))

const hafas = createHafas(vbbProfile, 'hafas-rest-api-example')

const api = createApi(hafas, config, (api) => {
	api.use('/logos', serve(logosDir, {index: false}))
})

const {logger} = api.locals
const port = process.env.PORT || 3000
api.listen(port, (err) => {
	if (err) {
		logger.error(err)
		process.exitCode = 1
	} else {
		logger.info(`Listening on ${config.hostname}:${port}.`)
	}
})
