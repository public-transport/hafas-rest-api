'use strict'

const createHafas = require('hafas-client')
const dbProfile = require('hafas-client/p/db')

const createApi = require('..')

const config = {
	hostname: process.env.HOSTNAME || 'db.transport.rest',
	port: process.env.PORT || 3000,
	name: 'db-rest',
	homepage: 'https://github.com/derhuerst/db-rest',
	logging: true,
	healthCheck: () => {
		return hafas.station('8011306')
		.then((station) => !!station)
	}
}

const hafas = createHafas(dbProfile, 'hafas-rest-api-example')

const api = createApi(hafas, config, () => {})

api.listen(config.port, (err) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.info(`Listening on ${config.hostname}:${config.port}.`)
	}
})
