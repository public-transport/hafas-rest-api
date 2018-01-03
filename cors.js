'use strict'

const corser = require('corser')

const defaultHeaders = ['User-Agent', 'X-Identifier']

const createCorsMiddleware = (headers = defaultHeaders) => {
	return corser.create({
		requestHeaders: corser.simpleRequestHeaders.concat(headers)
	})
}

module.exports = createCorsMiddleware
