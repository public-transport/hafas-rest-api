'use strict'

const tape = require('tape')
const tapePromise = require('tape-promise').default

const {
	stationA, stationB,
	unmocked,
	createTestApi
} = require('./util')

const test = tapePromise(tape)

test('/stop/:id', async(t) => {
	const {fetch, stop} = await createTestApi({
		stop: (id) => {
			if (id !== stationA.id) throw new Error('stop() called with invalid ID')
			return Promise.resolve(stationA)
		}
	})

	const {data} = await fetch('/stops/' + stationA.id)
	t.deepEqual(data, stationA)

	await stop()
	t.end()
})

test('/stop/:id', async(t) => {
	const {fetch, stop} = await createTestApi({
		nearby: (loc) => {
			if (loc.latitude !== 123) throw new Error('nearby() called with invalid latitude')
			if (loc.longitude !== 321) throw new Error('nearby() called with invalid longitude')
			return Promise.resolve([stationA, stationB])
		}
	})

	const {data} = await fetch('/stops/nearby?latitude=123&longitude=321')
	t.deepEqual(data, [stationA, stationB])

	await stop()
	t.end()
})

test('/journeys with POI', async(t) => {
	// fake data
	const someJourney = {_: Math.random().toString(16).slice(2)}

	const {fetch, stop} = await createTestApi({
		journeys: (from, to) => {
			t.equal(from, '123')
			t.deepEqual(to, {
				type: 'location',
				id: '321',
				poi: true,
				name: 'Foo',
				latitude: 1.23,
				longitude: 3.21
			})
			return Promise.resolve([someJourney])
		}
	})

	const {data} = await fetch('/journeys?from=123&to.id=321&to.name=Foo&to.latitude=1.23&to.longitude=3.21')
	t.deepEqual(data, [someJourney])

	await stop()
	t.end()
})

// todo
