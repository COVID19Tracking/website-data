require('dotenv').config()
const commandLineArgs = require('command-line-args')
const volunteers = require('./lib/volunteers')
const screenshots = require('./lib/screenshots')
const bigQuery = require('./lib/bigquery')
const longTermCareFacilities = require('./lib/long-term-care-facilities')
const tweets = require('./lib/tweets')
const annotations = require('./lib/annotations')
const crdtApi = require('./lib/crdt-api')
const hhs = require('./lib/hhs')

const options = commandLineArgs([
  { name: 'volunteers', alias: 'v', type: Boolean },
  { name: 'screenshots', alias: 's', type: Boolean },
  { name: 'bigquery', alias: 'b', type: Boolean },
  { name: 'ltcfacilities', alias: 'l', type: Boolean },
  { name: 'tweets', alias: 't', type: Boolean },
  { name: 'annotations', alias: 'a', type: Boolean },
  { name: 'hhs', alias: 'h', type: Boolean },
  { name: 'crdtapi', alias: 'c', type: Boolean },
])

const tasks = []
if (options.volunteers) {
  tasks.push(volunteers())
}

if (options.screenshots) {
  tasks.push(screenshots())
}

if (options.bigquery) {
  tasks.push(bigQuery())
}

if (options.ltcfacilities) {
  tasks.push(longTermCareFacilities())
}

if (options.tweets) {
  tasks.push(tweets())
}

if (options.annotations) {
  tasks.push(annotations())
}

if (options.hhs) {
  tasks.push(hhs())
}

if (options.crdtapi) {
  tasks.push(crdtApi())
}

Promise.all(tasks).then(() => {
  console.log('Done')
})
