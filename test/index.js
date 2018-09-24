'use strict'

const tape = require('tape')
const tapePromise = require('tape-promise').default

const {
	stationA, stationB,
	unmocked,
	createTestApi
} = require('./util')

const test = tapePromise(tape)

// todo
