'use strict'

const hafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const path = require('path')
const serve = require('serve-static')

const createApi = require('..')

const config = {
	hostname: process.env.HOSTNAME || 'vbb.transport.rest',
	port: process.env.PORT || 3000,
	name: 'vbb-rest',
	homepage: 'https://github.com/derhuerst/vbb-rest',
	logging: true
}

const client = hafas(vbbProfile)

const api = createApi(client, config)

const logosDir = path.dirname(require.resolve('vbb-logos/bus.svg'))
api.use('/logos', serve(logosDir, {index: false}))

api.listen(config.port, (err) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.info(`Listening on ${config.hostname}:${config.port}.`)
	}
})
