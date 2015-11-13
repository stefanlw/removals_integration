# bedspacemanagement

## Quickstart:

 Get [NodeJS](https://nodejs.org) via [nvm](https://github.com/creationix/nvm)
```
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.27.1/install.sh | bash
```
#### Install NodeJS 5.0.0
```
$ nvm install 5.0.0
$ nvm use 5.0.0
```
### Build:
```
$ npm install
```
### Test:
```
$ npm test
```
### CI Test:
```
$ npm run-script coverage-test
$ npm run-script coverage-report
```
### Start single-threaded unmanaged server:
```
$ npm start
```
### Start in production mode with MySQL server and Redis server:

(set environment variables to whatever you've configured)
```
NODE_ENV=productionAlter \
DB_HOST=localhost \
DB_port=3306 \
DB_USER=root \
DB_PASSWORD=root \
DB_NAME=sails \
REDIS_SENTINEL_SERVICE_HOST=localhost \
REDIS_SENTINEL_SERVICE_PORT=6379 \
PORT=8080 \
npm start
```
