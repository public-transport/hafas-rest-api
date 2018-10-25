'use strict'

const tape = require('tape')
const tapePromise = require('tape-promise').default

const {
	stationA, stationB,
	unmocked,
	createTestApi
} = require('./util')

const test = tapePromise(tape)

test('/station/:id', async(t) => {
	const {fetch, stop} = await createTestApi({
		station: (id) => {
			if (id !== stationA.id) throw new Error('station() called with invalid ID')
			return Promise.resolve(stationA)
		}
	})

	const {data} = await fetch('/stations/' + stationA.id)
	t.deepEqual(data, stationA)

	await stop()
	t.end()
})

test('/station/:id', async(t) => {
	const {fetch, stop} = await createTestApi({
		nearby: (loc) => {
			if (loc.latitude !== 123) throw new Error('nearby() called with invalid latitude')
			if (loc.longitude !== 321) throw new Error('nearby() called with invalid longitude')
			return Promise.resolve([stationA, stationB])
		}
	})

	const {data} = await fetch('/stations/nearby?latitude=123&longitude=321')
	t.deepEqual(data, [stationA, stationB])

	await stop()
	t.end()
})

// todo
