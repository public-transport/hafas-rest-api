'use strict'

const handleErrors = (err, req, res, next) => {
	if (process.env.NODE_ENV === 'dev') console.error(err)
	if (res.headersSent) return next()

	let msg = err.message, code = null
	if (err.isHafasError) {
		msg = 'VBB error: ' + msg
		code = 502
	}
	res.status(code || 500).json({error: true, msg})
	next()
}

module.exports = handleErrors
