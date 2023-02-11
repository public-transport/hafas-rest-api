import {
	HafasError,
	HafasInvalidRequestError,
	HafasNotFoundError,
} from 'hafas-client/lib/errors.js'

const createErrorHandler = (logger) => {
	const handleErrors = (err, req, res, next) => {
		logger.error(err)
		if (res.headersSent) return next()

		let msg = err.message, code = err.statusCode || null
		if (err instanceof HafasError) {
			msg = 'HAFAS error: ' + msg
			if (err instanceof HafasInvalidRequestError) {
				code = 400
			} else if (err instanceof HafasNotFoundError) {
				code = 404
			} else {
				code = 502
			}
		}

		res.status(code || 500).json({
			message: err.message || null,
			...err,
			request: undefined,
			response: undefined,
		})
		next()
	}
	return handleErrors
}

export {
	createErrorHandler,
}
