# hafas-rest-api

**Expose a [`hafas-client@5`](https://github.com/public-transport/hafas-client/tree/5) instance as an HTTP REST API.**

[![npm version](https://img.shields.io/npm/v/hafas-rest-api.svg)](https://www.npmjs.com/package/hafas-rest-api)
[![build status](https://api.travis-ci.org/public-transport/hafas-rest-api.svg?branch=master)](https://travis-ci.org/public-transport/hafas-rest-api)
![ISC-licensed](https://img.shields.io/github/license/public-transport/hafas-rest-api.svg)
[![chat on gitter](https://badges.gitter.im/public-transport/Lobby.svg)](https://gitter.im/public-transport/Lobby)
[![support Jannis via GitHub Sponsors](https://img.shields.io/badge/support%20Jannis-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)


## Installing

```shell
npm install hafas-rest-api
```


## Usage

```js
const createHafas = require('hafas-client')
const dbProfile = require('hafas-client/p/db')

const createApi = require('.')

const config = {
	hostname: 'example.org',
	name: 'my-hafas-rest-api',
	homepage: 'https://github.com/someone/my-hafas-rest-api',
	version: '1.0.0'
}

const hafas = createHafas(dbProfile, 'my-hafas-rest-api')
const api = createApi(hafas, config)

api.listen(3000, (err) => {
	if (err) console.error(err)
})
```

### `config` keys

key | description | mandatory? | default value
----|-------------|------------|--------------
`hostname` | The public hostname of the API. | ✔︎ | –
`port` | The port to listen on. | ✔︎ | –
`cors` | Enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)? | ✗ | `true`
`handleErrors` | Handle errors by sending `5**` codes and JSON. | ✗ | `true`
`logging` | Log requests using [`pino`](https://npmjs.com/package/pino)? | ✗ | `false`
`healthCheck` | A function that returning [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that resolve with `true` (for healthy) or `false`. | ✗ | –
`name` | The name of the API. Used for the `X-Powered-By` header and the about page. | ✔︎ | –
`version` | Used for the `X-Powered-By` and `X-API-Version` headers. | ✗ | –
`homepage` | Used for the `X-Powered-By` header. | ✗ | –
`aboutPage` | Enable the about page on `GET /`? | ✗ | `true`
`description` | Used for the about page. | ✗ | –
`docsLink` | Used for the about page. | ✗ | –
`addHafasOpts` | Computes additional `hafas-client` opts. `(opt, hafasClientMethod, httpReq) => additionaOpts` | ✗ | –

*Pro Tip:* Use [`hafas-client-health-check`](https://github.com/derhuerst/hafas-client-health-check) for `config.healthCheck`.


## Contributing

If you have a question or have difficulties using `hafas-rest-api`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/public-transport/hafas-rest-api/issues).
