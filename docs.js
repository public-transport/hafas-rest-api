'use strict'

const { assertNonEmptyString, assertBoolean } = require('./assert')
const escape = require('stringify-entities')
const markdown = require('markdown-it')

const createRoute = (config, profile) => {
	assertNonEmptyString(config, 'description')

	// TODO: add this to hafas-client profiles
	const examples = config.examples || {}

	const msg = markdown({
		html: true
	}).render(`
<style>
body {
	padding: 10px;
	margin: auto;
}
pre, code {
	background-color: #eee;
}
pre {
	padding: 10px;
}

@media (min-width: 600px) {
	body {
		width: 60vw;
		min-width: 580px;
		max-width: 1000px;
	}
}
</style>

# \`${escape(config.name)}\`
### ${escape(config.description)}

This API returns data in the [*Friendly Public Transport Format* \`1.2.0\`](https://github.com/public-transport/friendly-public-transport-format/blob/1.2.0/spec/readme.md).
In addition to the parameters documented below, all routes support a \`language\` parameter, which defaults to \`en\`.

**Note:** As stated in the [*Friendly Public Transport Format* \`1.2.0\`](https://github.com/public-transport/friendly-public-transport-format/tree/1.2.0), all returned \`departure\` and \`arrival\` times include the current delay.

## all routes

- [\`GET /locations\`](#get-locations)
- [\`GET /stations/nearby\`](#get-stationsnearby)
- [\`GET /stations/:id\`](#get-stationsid)
- [\`GET /stations/:id/departures\`](#get-stationsiddepartures)
- [\`GET /stations/:id/arrivals\`](#get-stationsidarrivals)
- [\`GET /journeys\`](#get-journeys)
${profile.refreshJourney ? `
	- [\`GET /journeys/:ref\`](#get-journeysref)
` : ''}
${profile.trip ? `
	- [\`GET /trips/:id\`](#get-tripsid)
` : ''}
${profile.radar ? `
	- [\`GET /radar\`](#get-radar)
` : ''}

***

<div id="get-locations"></div>

## \`GET /locations\`

Finds stations, POIs and addresses.

### parameters

- \`query\`: **Required**
- \`fuzzy\`: \`true\`/\`false\` – Default is \`true\`
- \`results\`: Maximum number of results. Default is \`10\`
- \`stations\`: Return stations? Default: \`true\`.
- \`addresses\`: Return addresses? Default: \`true\`.
- \`poi\`: Show points of interest? Default: \`true\`.
- \`stationLines\`: Return lines stopping at the station? Default: \`false\`.

${examples.stationName ? `
	### examples

	\`\`\`shell
	curl 'https://${config.hostname}/locations/?query=${encodeURIComponent(examples.stationName)}'
	\`\`\`
` : ''}

***

<div id="get-stationsnearby"></div>

## \`GET /stations/nearby\`

Returns stations and POIs around the given location

### parameters

- \`latitude\`: **Required**
- \`longitude\`: **Required**
- \`results\`: Maximum number of results. Default is \`8\`.
- \`distance\`: Maximum walking distance in meters. Default is \`null\`. TODO: what is the actual default?
- \`stations\`: Return stations? Default: \`true\`.
- \`poi\`: Show points of interest? Default: \`false\`.
- \`stationLines\`: Return lines stopping at the station? Default: \`false\`.

${examples.latitude && examples.longitude ? `
	### examples

	\`\`\`shell
	curl 'https://${config.hostname}/stations/nearby?latitude=${examples.latitude}&longitude=${examples.longitude}'
	\`\`\`
` : ''}

***

<div id="get-stationsid"></div>

## \`GET /stations/:id\`

Returns details about a station.

### parameters

- \`stationLines\`: Return lines of the station? Default: \`false\`.

${examples.stationId ? `
	### examples

	\`\`\`shell
	curl 'https://${config.hostname}/stations/${examples.stationId}'
	\`\`\`
` : ''}

***

<div id="get-stationsiddepartures"></div>

## \`GET /stations/:id/departures\`

Returns departures at a station.

### parameters

- \`when\`: A [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) or anything parsable by [\`parse-messy-time\`](https://github.com/substack/parse-messy-time#example). Default: now.
- \`duration\`: Show departures for the next \`n\` minutes. Default: \`10\`.
- \`direction\`: Only show departures heading to this station. Default: \`null\`.
- \`stationLines\`: Return lines of the station? Default: \`false\`.
- \`remarks\`: Return hints and warnings? Default: \`true\`.
- \`includeRelatedStations\`: Include departures at related stations, e.g. those that belong together on the metro map? Default: \`true\`.

${examples.stationId ? `
	### examples

	\`\`\`shell
	curl 'https://${config.hostname}/stations/${examples.stationId}/departures'
	\`\`\`
` : ''}

***

<div id="get-stationsidarrivals"></div>

## \`GET /stations/:id/arrivals\`

Returns arrivals at a station.

### parameters

- \`when\`: A [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) or anything parsable by [\`parse-messy-time\`](https://github.com/substack/parse-messy-time#example). Default: now.
- \`duration\`: Show departures for the next \`n\` minutes. Default: \`10\`.
- \`direction\`: Only show departures heading to this station. Default: \`null\`.
- \`stationLines\`: Return lines of the station? Default: \`false\`.
- \`remarks\`: Return hints and warnings? Default: \`true\`.
- \`includeRelatedStations\`: Include arrivals at related stations, e.g. those that belong together on the metro map? Default: \`true\`.

${examples.stationId ? `
	### examples

	\`\`\`shell
	curl 'https://${config.hostname}/stations/${examples.stationId}/arrivals'
	\`\`\`
` : ''}

***

<div id="get-journeys"></div>

## \`GET /journeys\`

Returns journey data for a route.

\`from\` and \`to\` parameters must be either in [station format](#station-format), [POI format](#poi-format) or [address format](#address-format) (you can mix them).
Either \`departure\` or \`arrival\` can be specified.

<div id="station-format"></div>

### parameters

#### station format

- \`from\`: **Required.** Station ID${examples.stationId ? ` (e.g. \`${examples.stationId}\`)` : ''}.
- \`to\`: **Required.** Station ID${examples.stationId ? ` (e.g. \`${examples.stationId}\`)` : ''}.

<div id="poi-format"></div>

#### POI format

- \`from.latitude\`/\`to.latitude\`: **Required.** Latitude${examples.latitude ? ` (e.g. \`${examples.latitude}\`)` : ''}.
- \`from.longitude\`/\`to.longitude\`: **Required.** Longitude${examples.longitude ? ` (e.g. \`${examples.longitude}\`)` : ''}.
- \`from.name\`/\`to.name\`: Name of the locality${examples.poiName ? ` (e.g. \`${examples.poiName}\`)` : ''}.
- \`from.id\`/\`to.id\`: **Required.**${examples.poiId ? ` POI ID (e.g. \`${examples.poiId}\`)` : ''}.

<div id="address-format"></div>

#### address format

- \`from.latitude\`/\`to.latitude\`: **Required.** Latitude${examples.latitude ? ` (e.g. \`${examples.latitude}\`)` : ''}.
- \`from.longitude\`/\`to.longitude\`: **Required.** Longitude${examples.longitude ? ` (e.g. \`${examples.longitude}\`)` : ''}.
- \`from.address\`/\`to.address\`: **Required.** Address${examples.address ? ` (e.g. \`${examples.address}\`)` : ''}.

#### products

${profile.products.map(product => `\
- \`${product.id}\`: Include ${product.name}? Default: \`${product.default}\`
`).join('')}

#### other parameters

- \`departure\`: Show journeys departing at this time. A [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) or anything parsable by [\`parse-messy-time\`](https://github.com/substack/parse-messy-time#example). Default: now.
- \`arrival\`: Show journeys arriving at this time. A [UNIX timestamp](https://en.wikipedia.org/wiki/Unix_time) or anything parsable by [\`parse-messy-time\`](https://github.com/substack/parse-messy-time#example). Default: \`null\`.
- \`via\`: Intermediate stop specified just as \`from\` and \`to\`. Default: \`null\`.
- \`results\`: Maximum number of results. Default: \`5\`.
- \`stopovers\`: Return stations on the way? Default: \`false\`.
- \`transfers\`: Maximum number of transfers. Default: \`5\`.
- \`transferTime\`: Minimum time in minutes for a single transfer. Default: \`0\`.
- \`accessibility\`: Possible values: \`partial\`, \`complete\`. Default: \`none\`.
- \`bike\`: Return only bike-friendly journeys. Default: \`false\`.
- \`tickets\`: Return information about available tickets. Default: \`false\`.
- \`polylines\`: Return leg shapes? Default: \`false\`.
- \`remarks\`: Return hints and warnings? Default: \`true\`.
- \`startWithWalking\`: Consider walking to nearby stations at the beginning of a journey? Default: \`true\`.
- \`earlierThan\`: TODO
- \`laterThan\`: TODO

${(examples.journeyFrom && examples.journeyTo) ? `
	### examples

	\`\`\`shell
	curl 'https://${config.hostname}/journeys?from=${examples.journeyFrom}&to=${examples.journeyTo}'
	\`\`\`
` : ''}

${profile.refreshJourney ? `
	***

	<div id="get-journeysref"></div>

	## \`GET /journeys/:ref\`

	Returns updated journey data. Takes a reference obtained from the \`/journeys\` route's \`refreshToken\` field.

	### parameters

	- \`stopovers\`: Return stations on the way? Default: \`false\`.
	- \`tickets\`: Return information about available tickets. Default: \`false\`.
	- \`polylines\`: Return leg shapes? Default: \`false\`.
	- \`remarks\`: Return hints and warnings? Default: \`true\`.

	${examples.journeysRef ? `
		### examples

		\`\`\`shell
		curl 'https://${config.hostname}/journeys/${examples.journeysRef}'
		\`\`\`
	`: ''}
` : ''}

${profile.trip ? `
	***

	<div id="get-tripsid"></div>

	## \`GET /trips/:id\`

	Returns details about the exact trip, from first station to last.

	### parameters

	- \`lineName\`: **Required** \`line.name\` field from the journey leg
	- \`stopovers\`: Return stations on the way? Default: \`true\`.
	- \`polyline\`: Return a track shape? Default: \`false\`.
	- \`remarks\`: Return hints and warnings? Default: \`true\`.

	${examples.tripId ? `
		### examples

		\`\`\`shell
		curl 'https://${config.hostname}/trips/${examples.tripId}'
		\`\`\`
	` : ''}
` : ''}

${profile.radar ? `
	***

	<div id="get-radar"></div>

	## \`GET /radar\`

	Returns all vehicles currently in a certain area.

	### parameters

	- \`north\`: **Required** Northern latitude.
	- \`west\`: **Required** Western longtidue.
	- \`south\`: **Required** Southern latitude.
	- \`east\`: **Required** Eastern longtidue.
	- \`results\`: How many vehicles shall be shown? Default: \`256\`.
	- \`duration\`: Compute frames for how many seconds? Default: \`30\`.
	- \`frames\`: Number of frames to compute. Default: \`3\`.
	- \`polylines\`: Return a track shape for each vehicle? Default: \`false\`.

	${examples.latitude && examples.longitude ? `
		### examples

		\`\`\`shell
		curl 'https://${config.hostname}/radar?north=${examples.latitude}&west=${examples.longitude}&south=${Number(examples.latitude)-0.1}&east=${Number(examples.longitude)+0.1}'
		\`\`\`
	` : ''}
` : ''}
	`.replace(/\t/g, ''))

	const docs = (req, res, next) => {
		if (!req.accepts('html')) return next()

		res.set('content-type', 'text/html')
		res.send(msg)
		next()
	}
	return docs
}


module.exports = createRoute
