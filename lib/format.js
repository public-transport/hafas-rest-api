'use strict'

const {DateTime} = require('luxon')

const formatWhen = (t, tz = null) => {
	const dt = DateTime.fromMillis(t, {zone: tz})
	return dt.toISO({
		suppressMilliseconds: true,
		suppressSeconds: true,
	})
}

module.exports = {
	formatWhen,
}
