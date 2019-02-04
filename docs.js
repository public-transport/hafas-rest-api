'use strict'

// const escape = require('stringify-entities')
const MarkdownRender = require('markdown-it')

const md = new MarkdownRender()
// todo: https://github.com/markdown-it/markdown-it/issues/28

const createDocsRoute = (cfg) => {
	if ('string' !== typeof cfg.docsAsMarkdown) {
		throw new Error('cfg.docsAsMarkdown must be a string.')
	}
	const docsAsHtml = md.render(cfg.docsAsMarkdown)

	const docs = (req, res, next) => {
		res.set('content-type', 'text/html')
		res.send(docsAsHtml)
		next()
	}
	return docs
}

module.exports = createDocsRoute
