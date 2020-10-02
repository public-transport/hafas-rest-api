'use strict'

const path = require('path')
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')

const createApi = require('..')

// pro tip: pipe this script into `pino-pretty` to get nice logs

const config = {
	hostname: process.env.HOSTNAME || '3.vbb.transport.rest',
	name: 'vbb-rest',
	version: '1.2.3',
	description: 'An HTTP API for Berlin & Brandenburg public transport.',
	homepage: 'http://example.org/',
	docsLink: 'http://example.org/docs',
	logging: true,
	aboutPage: true,
	healthCheck: async () => {
		const stop = await hafas.stop('900000100001')
		return !!stop
	}
}

const hafas = createHafas(vbbProfile, 'hafas-rest-api-example')

const api = createApi(hafas, config, () => {})

const {logger} = api.locals
const port = process.env.PORT || 3000
api.listen(port, (err) => {
	if (err) {
		logger.error(err)
		process.exitCode = 1
	} else {
		logger.info(`Listening on ${config.hostname}:${port}.`)
	}
})
