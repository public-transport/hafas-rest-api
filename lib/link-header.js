'use strict'

const LinkHeader = require('http-link-header')

const formatLinkHeader = ({prev, next, first, last}) => {
	const header = new LinkHeader()
	if (first) header.set({rel: 'first', uri: first})
	if (prev) header.set({rel: 'prev', uri: prev})
	if (next) header.set({rel: 'next', uri: next})
	if (last) header.set({rel: 'last', uri: last})
	return header.toString()
}

module.exports = formatLinkHeader
