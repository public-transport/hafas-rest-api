'use strict'

const departures = (station, opt) => {
	if ('string' !== typeof station) throw new Error('station must be a string')

	opt = Object.assign({
		duration: 10
	})
	opt.when = opt.when || new Date()

	const res = [
	// todo
	]
	return Promise.resolve(res)
}

module.exports = departures
