import createHafas from 'hafas-client'
import dbProfile from 'hafas-client/p/db/index.js'

import {parseBoolean} from '../lib/parse.js'
import {createHafasRestApi} from '../index.js'

const fooRoute = (req, res) => {
	res.json(req.query.bar === 'true' ? 'bar' : 'foo')
}
fooRoute.queryParameters = {
	bar: {
		description: 'Return "bar"?',
		type: 'boolean',
		default: false,
		parse: parseBoolean,
	},
}

// pro tip: pipe this script into `pino-pretty` to get nice logs

const config = {
	hostname: process.env.HOSTNAME || 'v5.db.transport.rest',
	name: 'db-rest',
	version: '5.0.0',
	description: 'An HTTP API for Deutsche Bahn.',
	homepage: 'http://example.org/',
	docsLink: 'http://example.org/docs',
	logging: true,
	healthCheck: async () => {
		const stop = await hafas.stop('8011306')
		return !!stop
	},
	modifyRoutes: (routes) => ({
		...routes,
		'/foo': fooRoute,
	}),
}

const hafas = createHafas(dbProfile, 'hafas-rest-api-example')

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
