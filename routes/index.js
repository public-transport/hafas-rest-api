'use strict'

const nearby = require('./nearby')
const stop = require('./stop')
const departures = require('./departures')
const arrivals = require('./arrivals')
const journeys = require('./journeys')
const locations = require('./locations')

const getRoutes = (hafas, config) => {
	const routes = Object.create(null)

	routes['/stops/nearby'] = nearby(hafas, config)
	if (hafas.reachableFrom) {
		const reachableFrom = require('./reachable-from')
		routes['/stops/reachable-from'] = reachableFrom(hafas, config)
	}
	routes['/stops/:id'] = stop(hafas, config)
	routes['/stops/:id/departures'] = departures(hafas, config)
	routes['/stops/:id/arrivals'] = arrivals(hafas, config)
	routes['/journeys'] = journeys(hafas, config)
	if (hafas.trip) {
		const trip = require('./trip')
		routes['/trips/:id'] = trip(hafas, config)
	}
	routes['/locations'] = locations(hafas, config)
	if (config.events) {
		const events = require('./events')
		routes['/events'] = events(hafas, config)
	}
	if (hafas.radar) {
		const radar = require('./radar')
		routes['/radar'] = radar(hafas, config)
	}
	if (hafas.refreshJourney) {
		const refreshJourney = require('./refresh-journey')
		routes['/journeys/:ref'] = refreshJourney(hafas, config)
	}

	return routes
}

module.exports = getRoutes
