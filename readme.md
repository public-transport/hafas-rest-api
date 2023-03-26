# hafas-rest-api

**Expose a [`hafas-client@6`](https://github.com/public-transport/hafas-client/tree/6) instance as an HTTP REST API.**

[![npm version](https://img.shields.io/npm/v/hafas-rest-api.svg)](https://www.npmjs.com/package/hafas-rest-api)
![ISC-licensed](https://img.shields.io/github/license/public-transport/hafas-rest-api.svg)
[![support Jannis via GitHub Sponsors](https://img.shields.io/badge/support%20Jannis-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with Jannis on Twitter](https://img.shields.io/badge/chat%20with%20Jannis-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


## Installing

```shell
npm install hafas-rest-api
```


## Usage

```js
import {createClient as createHafas} from 'hafas-client'
import {profile as dbProfile} from 'hafas-client/p/db/index.js'
import {createHafasRestApi as createApi} from 'hafas-rest-api'

const config = {
	hostname: 'example.org',
	name: 'my-hafas-rest-api',
	homepage: 'https://github.com/someone/my-hafas-rest-api',
	version: '1.0.0',
	aboutPage: false
}

const hafas = createHafas(dbProfile, 'my-hafas-rest-api')
const api = await createApi(hafas, config)

api.listen(3000, (err) => {
	if (err) console.error(err)
})
```

### `config` keys

key | description | mandatory? | default value
----|-------------|------------|--------------
`hostname` | The public hostname of the API. | ✔︎ | –
`name` | The name of the API. Used for the `X-Powered-By` header and the about page. | ✔︎ | –
`description` | Used for the about page. | ✔︎ (with `aboutPage: true`) | –
`docsLink` | Used for the about page. | ✔︎ (with `aboutPage: true`) | –
`cors` | Enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)? | ✗ | `true`
`etags` | [Express config](https://expressjs.com/en/4x/api.html#etag.options.table) for [`ETag` headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) | ✗ | `weak`
`handleErrors` | Handle errors by sending `5**` codes and JSON. | ✗ | `true`
`logging` | Log requests using [`pino`](https://npmjs.com/package/pino)? | ✗ | `false`
`healthCheck` | A function that returning [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that resolve with `true` (for healthy) or `false`. | ✗ | –
`version` | Used for the `X-Powered-By` and `X-API-Version` headers. | ✗ | –
`homepage` | Used for the `X-Powered-By` header. | ✗ | –
`aboutPage` | Enable the about page on `GET /`? | ✗ | `true`
`openapiSpec` | Generate and serve an [OpenAPI spec](https://en.wikipedia.org/wiki/OpenAPI_Specification) of the API? | ✗ | `false`
`addHafasOpts` | Computes additional `hafas-client` opts. `(opt, hafasClientMethod, httpReq) => additionaOpts` | ✗ | –
`modifyRoutes` | Extend or modify the [default routes](routes/index.js). | ✗ | `routes => routes`

*Pro Tip:* Use [`hafas-client-health-check`](https://github.com/public-transport/hafas-client-health-check) for `config.healthCheck`.


## Contributing

If you have a question or have difficulties using `hafas-rest-api`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/public-transport/hafas-rest-api/issues).
