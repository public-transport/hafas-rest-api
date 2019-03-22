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

// todo
