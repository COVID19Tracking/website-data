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
  return new Promise((resolve) => {
    const data = {}
    fs.readdir('./_hhs/data/hhs', (err, files) => {
      files.forEach((file) => {
        const type = Object.keys(types).find((type) => file.search(type) > -1)
        if (typeof data[type] === 'undefined') {
          data[type] = {}
        }
        const rowData = fs.readFileSync(`./_hhs/data/hhs/${file}`).toString()
        parse(rowData, {
          columns: (row) => {
            const newRow = []
            row.forEach((item) => {
              newRow.push(item.replace(/[^0-9a-zA-Z_]/g, ''))
            })
            return newRow
          },
          skip_empty_lines: true,
        }).forEach((row) => {
          data[type][`${row[types[type].state]}-${row[types[type].date]}`] = row
        })
      })

      Object.keys(data).forEach((key) => {
        fs.outputJsonSync(`./_data/hhs_${key}.json`, Object.values(data[key]))
      })
      resolve()
    })
  })
}
