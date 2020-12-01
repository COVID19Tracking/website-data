const { BigQuery } = require('@google-cloud/bigquery')
const fs = require('fs-extra')
const parse = require('csv-parse/lib/sync')

const types = {
  reported_hospital_utilization: {
    state: 'state',
    date: 'reporting_cutoff_start',
  },
  estimated_inpatient_covid: {
    state: 'state',
    date: 'collection_date',
  },
  estimated_inpatient_all: {
    state: 'state',
    date: 'collection_date',
  },
  estimated_icu: {
    state: 'state',
    date: 'collection_date',
  },
  'covid-19_diagnostic_lab_testing': {
    state: 'state',
    date: 'date',
  },
}

module.exports = () => {
  return new Promise((resolve, reject) => {
    const data = {}
    const queue = []
    fs.readdir('./_hhs/data/hhs', (err, files) => {
      files.forEach((file) => {
        const type = Object.keys(types).find((type) => file.search(type) > -1)
        if (typeof data[type] === 'undefined') {
          data[type] = {}
        }
        const rows = fs.readFileSync(`./_hhs/data/hhs/${file}`).toString()
        parse(rows, {
          columns: true,
          skip_empty_lines: true,
        }).forEach((row) => {
          if (typeof data[type][row[types[type].state]] === 'undefined') {
            data[type][row[types[type].state]] = {}
          }
          data[type][row[types[type].state]][row[types[type].date]] = row
        })
      })
      Object.keys(data).forEach((key) => {
        const rows = []
        Object.keys(data[key]).forEach((state) => {
          Object.keys(data[key][state]).forEach((date) => {
            rows.push(data[key][state][date])
          })
        })
        fs.outputJsonSync(`./_data/hhs_${key}.json`, rows)
      })
      resolve()
    })
  })
}
