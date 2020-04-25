'use strict'

const tape = require('tape')
const tapePromise = require('tape-promise').default

const {
	stationA, stationB,
	unmocked,
	fetchWithTestApi,
} = require('./util')

const test = tapePromise(tape)

test('/stop/:id', async(t) => {
	const mockHafas = {
		stop: (id) => {
			if (id !== stationA.id) throw new Error('stop() called with invalid ID')
			return Promise.resolve(stationA)
		}
	}

	const path = '/stops/' + stationA.id
	const {data} = await fetchWithTestApi(mockHafas, {}, path)
	t.deepEqual(data, stationA)
	t.end()
})

test('/stop/:id', async(t) => {
	const mockHafas = {
		nearby: (loc) => {
			if (loc.latitude !== 123) throw new Error('nearby() called with invalid latitude')
			if (loc.longitude !== 321) throw new Error('nearby() called with invalid longitude')
			return Promise.resolve([stationA, stationB])
		}
	}

	const path = '/stops/nearby?latitude=123&longitude=321'
	const {data} = await fetchWithTestApi(mockHafas, {}, path)
	t.deepEqual(data, [stationA, stationB])
	t.end()
})

test('/journeys with POI', async(t) => {
	// fake data
	const someJourney = {_: Math.random().toString(16).slice(2)}
	const earlierRef = 'some-earlier-ref'
	const laterRef = 'some-later-ref'

	const mockHafas = {
		journeys: async (from, to) => {
			t.equal(from, '123')
			t.deepEqual(to, {
				type: 'location',
				id: '321',
				poi: true,
				name: 'Foo',
				latitude: 1.23,
				longitude: 3.21
			})
			return {
				earlierRef, laterRef,
				journeys: [someJourney]
			}
		}
	}

	const query = '?from=123&to.id=321&to.name=Foo&to.latitude=1.23&to.longitude=3.21'
	const path = '/journeys' + query
	const {data} = await fetchWithTestApi(mockHafas, {}, path)

	t.deepEqual(data.journeys, [someJourney])
	t.equal(data.earlierRef, earlierRef)
	t.equal(data.laterRef, laterRef)
	t.end()
})

// todo
