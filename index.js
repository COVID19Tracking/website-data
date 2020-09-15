require('dotenv').config()
const volunteers = require('./lib/volunteers')
const screenshots = require('./lib/screenshots')
const bigQuery = require('./lib/bigquery')

screenshots()
  .then(() => volunteers())
  .then(() => bigQuery())
  .then(() => {
    console.log('Done')
  })
