# hafas-rest-api

**Expose a HAFAS client via an HTTP REST API.**

[![npm version](https://img.shields.io/npm/v/hafas-rest-api.svg)](https://www.npmjs.com/package/hafas-rest-api)
[![build status](https://api.travis-ci.org/derhuerst/hafas-rest-api.svg?branch=master)](https://travis-ci.org/derhuerst/hafas-rest-api)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/hafas-rest-api.svg)
[![chat on gitter](https://badges.gitter.im/derhuerst.svg)](https://gitter.im/derhuerst)


## Installing

```shell
npm install hafas-rest-api
```


## Usage

```js
const hafas = require('hafas-client')
const dbProfile = require('hafas-client/p/db')

const createApi = require('.')

const config = {
	hostname: 'example.org',
	port: 3000,
	name: 'my-hafas-rest-api',
	homepage: 'https://github.com/someone/my-hafas-rest-api'
}

const client = hafas(dbProfile)
const api = createApi(client, config)

api.listen(config.port, (err) => {
	if (err) console.error(err)
})
```


## Contributing

If you have a question or have difficulties using `hafas-rest-api`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/hafas-rest-api/issues).
