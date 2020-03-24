'use strict'

const createErrorHandler = (logger) => {
	const handleErrors = (err, req, res, next) => {
		logger.error(err)
		if (res.headersSent) return next()

		let msg = err.message, code = err.statusCode || null
		if (err.isHafasError) {
			msg = 'HAFAS error: ' + msg
			code = 502
		} else if (err.name === 'TypeError') {
			code = 400
		}
		res.status(code || 500).json({error: true, msg})
		next()
	}
	return handleErrors
}

module.exports = createErrorHandler
