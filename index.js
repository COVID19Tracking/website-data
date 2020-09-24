require('dotenv').config()
const commandLineArgs = require('command-line-args')
const volunteers = require('./lib/volunteers')
const screenshots = require('./lib/screenshots')
const bigQuery = require('./lib/bigquery')
const longTermCareFacilities = require('./lib/long-term-care-facilities')

const options = commandLineArgs([
  { name: 'volunteers', alias: 'v', type: Boolean },
  { name: 'screenshots', alias: 's', type: Boolean },
  { name: 'bigquery', alias: 'b', type: Boolean },
  { name: 'ltcfacilities', alias: 'l', type: Boolean },
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

Promise.all(tasks).then(() => {
  console.log('Done')
})
