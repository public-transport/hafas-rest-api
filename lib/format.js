import {DateTime} from 'luxon'

const formatWhen = (t, tz = null) => {
	const dt = DateTime.fromMillis(t, {zone: tz})
	return dt.toISO({
		suppressMilliseconds: true,
		suppressSeconds: true,
	})
}

export {
	formatWhen,
}
