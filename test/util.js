import {createClient as createHafas} from 'hafas-client'
import {profile as dbProfile} from 'hafas-client/p/db/index.js'
import getPort from 'get-port'
import {createServer} from 'http'
import {promisify} from 'util'
import axios from 'axios'

import {createHafasRestApi as createApi} from '../index.js'

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

const createHealthCheck = hafas => async () => {
	const stop = await hafas.stop('8011306')
	return !!stop
}

// prevent hafas-client's user-agent randomization
// todo: introduce a flag for this
const unmocked = createHafas({
	...dbProfile,
	transformReq: (ctx, req) => {
		req.headers['user-agent'] = 'DB Navigator/21.10.04 (iPhone; iOS 14.8.1; Scale/3.00)'
		return req
	},
}, 'hafas-rest-api test')

const createTestApi = async (mocks, cfg) => {
	const mocked = Object.assign(Object.create(unmocked), mocks)
	cfg = Object.assign({
		hostname: 'localhost',
		name: 'test',
		version: '1.2.3a',
		homepage: 'http://example.org',
		description: 'test API',
		docsLink: 'https://example.org',
		logging: false,
		healthCheck: createHealthCheck(mocked)
	}, cfg)

	const api = await createApi(mocked, cfg, () => {})
	const server = createServer(api)

	const port = await getPort()
	await promisify(server.listen.bind(server))(port)

	const stop = () => promisify(server.close.bind(server))()
	const fetch = (path, opt = {}) => {
		opt = Object.assign({
			method: 'get',
			baseURL: `http://localhost:${port}/`,
			url: path,
			timeout: 5000
		}, opt)
		return axios(opt)
	}
	return {stop, fetch}
}

const fetchWithTestApi = async (mocks, cfg, path, opt = {}) => {
	const {fetch, stop} = await createTestApi(mocks, cfg)
	try {
		const res = await fetch(path, opt)
		return res
	} finally {
		await stop()
	}
}

export {
	stationA,
	stationB,
	unmocked,
	createTestApi,
	fetchWithTestApi,
}
