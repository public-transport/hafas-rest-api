'use strict'

const escape = require('stringify-entities')

const createRoute = (name, description, docsLink) => {
	if ('string' !== typeof name || !name) {
		throw new Error('name must be a string.')
	}
	if ('string' !== typeof description || !description) {
		throw new Error('description must be a string.')
	}
	if ('string' !== typeof docsLink || !docsLink) {
		throw new Error('docsLink must be a string.')
	}

	const msg = `\
<h1><code>${escape(name)}</code></h1>
<p>${escape(description)}</p>
<p><a href="${escape(docsLink)}">documentation</a></p>`

	const about = (req, res, next) => {
		if (!req.accepts('html')) return next()

		res.set('content-type', 'text/html')
		res.send(msg)
		next()
	}
	return about
}

module.exports = createRoute
