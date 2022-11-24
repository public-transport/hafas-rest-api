import {createNearbyRoute as nearby} from './nearby.js'
import {createStopRoute as stop} from './stop.js'
import {createDeparturesRoute as departures} from './departures.js'
import {createArrivalsRoute as arrivals} from './arrivals.js'
import {createJourneysRoute as journeys} from './journeys.js'
import {createLocationsRoute as locations} from './locations.js'

const getAllRoutes = async (hafas, config) => {
	const routes = Object.create(null)

	if (hafas.reachableFrom) {
		const {
			createReachableFromRoute: reachableFrom,
		} = await import('./reachable-from.js')
		routes['/stops/reachable-from'] = reachableFrom(hafas, config)
	}
	routes['/stops/:id'] = stop(hafas, config)
	routes['/stops/:id/departures'] = departures(hafas, config)
	routes['/stops/:id/arrivals'] = arrivals(hafas, config)
	routes['/journeys'] = journeys(hafas, config)
	if (hafas.trip) {
		const {
			createTripRoute: trip,
		} = await import('./trip.js')
		routes['/trips/:id'] = trip(hafas, config)
	}
	routes['/locations/nearby'] = nearby(hafas, config)
	routes['/locations'] = locations(hafas, config)
	if (hafas.radar) {
		const {
			createRadarRoute: radar,
		} = await import('./radar.js')
		routes['/radar'] = radar(hafas, config)
	}
	if (hafas.refreshJourney) {
		const {
			createRefreshJourneyRoute: refreshJourney,
		} = await import('./refresh-journey.js')
		routes['/journeys/:ref'] = refreshJourney(hafas, config)
	}

	return routes
}

export {
	getAllRoutes,
}
