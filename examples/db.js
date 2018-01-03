'use strict'

const hafas = require('hafas-client')
const dbProfile = require('hafas-client/p/db')

const createApi = require('..')

const config = {
	hostname: process.env.HOSTNAME || 'db.transport.rest',
	port: process.env.PORT || 3000,
	name: 'db-rest',
	homepage: 'https://github.com/derhuerst/db-rest',
	logging: true
}

const client = hafas(dbProfile)

const api = createApi(client, config, () => {})

api.listen(config.port, (err) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.info(`Listening on ${config.hostname}:${config.port}.`)
	}
})
