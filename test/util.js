'use strict'

const createHafas = require('hafas-client')
const dbProfile = require('hafas-client/p/db')
const getPort = require('get-port')
const {createServer} = require('http')
const {promisify} = require('util')
const axios = require('axios')

const createApi = require('..')

const stationA = {
	type: 'station',
	id: '12345678',
	name: 'A',
	location: {type: 'location', latitude: 1.23, longitude: 3.21}
}
const stationB = {
	type: 'station',
	id: '87654321',
	name: 'B',
	location: {type: 'location', latitude: 2.34, longitude: 4.32}
}

const createHealthCheck = hafas => () => hafas.station('8011306').then(st => !!st)

const unmocked = createHafas(dbProfile, 'hafas-rest-api test')

const createTestApi = async (mocks, cfg) => {
	const mocked = Object.assign(Object.create(unmocked), mocks)
	cfg = Object.assign({
		hostname: 'localhost',
		name: 'test',
		description: 'test API',
		docsLink: 'https://example.org',
		logging: false,
		healthCheck: createHealthCheck(mocked)
	}, cfg)
	cfg.port = await getPort()

	const api = createApi(mocked, cfg, () => {})
	const server = createServer(api)
	await promisify(server.listen.bind(server))(cfg.port)

	const stop = () => promisify(server.close.bind(server))()
	const fetch = (path, opt = {}) => {
		opt = Object.assign({
			method: 'get',
			baseURL: `http://localhost:${cfg.port}/`,
			url: path,
			timeout: 5000
		}, opt)
		return axios(opt)
	}
	return {stop, fetch}
}

module.exports = {
	stationA,
	stationB,
	unmocked,
	createTestApi
}
