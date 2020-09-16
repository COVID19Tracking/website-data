require('dotenv').config()
const commandLineArgs = require('command-line-args')
const volunteers = require('./lib/volunteers')
const screenshots = require('./lib/screenshots')
const bigQuery = require('./lib/bigquery')

const options = commandLineArgs([
  { name: 'volunteer', alias: 'v', type: Boolean },
  { name: 'screenshots', alias: 's', type: Boolean },
  { name: 'bigquery', alias: 'b', type: Boolean },
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

Promise.all(tasks).then(() => {
  console.log('Done')
})
