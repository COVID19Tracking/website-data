const fs = require('fs-extra')
const { DateTime } = require('luxon')
const Airtable = require('airtable')
const parse = require('csv-parse/lib/sync')

const numberFields = [
  'critical_staffing_shortage_today_yes',
  'critical_staffing_shortage_today_no',
  'critical_staffing_shortage_today_not_reported',
  'critical_staffing_shortage_anticipated_within_week_yes',
  'critical_staffing_shortage_anticipated_within_week_no',
  'critical_staffing_shortage_anticipated_within_week_not_reported',
  'hospital_onset_covid',
  'hospital_onset_covid_coverage',
  'inpatient_beds',
  'inpatient_beds_coverage',
  'inpatient_beds_used',
  'inpatient_beds_used_coverage',
  'inpatient_beds_used_covid',
  'inpatient_beds_used_covid_coverage',
  'previous_day_admission_adult_covid_confirmed',
  'previous_day_admission_adult_covid_confirmed_coverage',
  'previous_day_admission_adult_covid_suspected',
  'previous_day_admission_adult_covid_suspected_coverage',
  'previous_day_admission_pediatric_covid_confirmed',
  'previous_day_admission_pediatric_covid_confirmed_coverage',
  'previous_day_admission_pediatric_covid_suspected',
  'previous_day_admission_pediatric_covid_suspected_coverage',
  'staffed_adult_icu_bed_occupancy',
  'staffed_adult_icu_bed_occupancy_coverage',
  'staffed_icu_adult_patients_confirmed_and_suspected_covid',
  'staffed_icu_adult_patients_confirmed_and_suspected_covid_coverage',
  'staffed_icu_adult_patients_confirmed_covid',
  'staffed_icu_adult_patients_confirmed_covid_coverage',
  'total_adult_patients_hospitalized_confirmed_and_suspected_covid',
  'total_adult_patients_hospitalized_confirmed_and_suspected_covid_coverage',
  'total_adult_patients_hospitalized_confirmed_covid',
  'total_adult_patients_hospitalized_confirmed_covid_coverage',
  'total_pediatric_patients_hospitalized_confirmed_and_suspected_covid',
  'total_pediatric_patients_hospitalized_confirmed_and_suspected_covid_coverage',
  'total_pediatric_patients_hospitalized_confirmed_covid',
  'total_pediatric_patients_hospitalized_confirmed_covid_coverage',
  'total_staffed_adult_icu_beds',
  'total_staffed_adult_icu_beds_coverage',
  'inpatient_beds_utilization',
  'inpatient_beds_utilization_coverage',
  'inpatient_beds_utilization_numerator',
  'inpatient_beds_utilization_denominator',
  'percent_of_inpatients_with_covid',
  'percent_of_inpatients_with_covid_coverage',
  'percent_of_inpatients_with_covid_numerator',
  'percent_of_inpatients_with_covid_denominator',
  'inpatient_bed_covid_utilization',
  'inpatient_bed_covid_utilization_coverage',
  'inpatient_bed_covid_utilization_numerator',
  'inpatient_bed_covid_utilization_denominator',
  'adult_icu_bed_covid_utilization',
  'adult_icu_bed_covid_utilization_coverage',
  'adult_icu_bed_covid_utilization_numerator',
  'adult_icu_bed_covid_utilization_denominator',
  'adult_icu_bed_utilization',
  'adult_icu_bed_utilization_coverage',
  'adult_icu_bed_utilization_numerator',
  'adult_icu_bed_utilization_denominator',
]

const getConfig = () => {
  return new Promise((resolve) => {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      'appgP55CLDn16S6NH'
    )
    const states = []
    const config = []
    base('HHS Testing States')
      .select({
        view: 'Grid view',
      })
      .eachPage(
        (records, fetchNextPage) => {
          records.forEach((record) => {
            states.push({
              state: record.get('State'),
              notes: record.get('HHS Testing Data Notes'),
              sourceNotes: record.get('HHS Testing Data Source'),
            })
          })
          fetchNextPage()
        },
        (error) => {
          base('HHS Testing Config')
            .select({
              view: 'Grid view',
            })
            .eachPage(
              (records, fetchNextPage) => {
                records.forEach((record) => {
                  if (record.get('FileUrl')) {
                    config.push({
                      file: record.get('FileUrl'),
                      description: record.get('FileDesc'),
                    })
                  }
                })
                fetchNextPage()
              },
              (error) => {
                resolve({ states, config })
              }
            )
          if (error) {
            reject(error)
          }
          return states
        }
      )
    return
  })
}

module.exports = () => {
  return new Promise(async (resolve) => {
    getConfig().then((config) => {
      const data = []
      const testData = fs
        .readFileSync(
          `./_hhs/data/hhs/${
            config.config.find((item) => item.description === 'HHS Testing')
              .file
          }`
        )
        .toString()
        .replace(/\r/g, '')
        .replace('﻿', '')
        .split('\n')
      const headers = testData[0].split(',')

      const hhsTesting = {}
      const allData = []
      testData.forEach((csvRow) => {
        const row = {}
        headers.forEach((header, index) => {
          row[header] = csvRow.split(',')[index]
        })
        allData.push(row)
        if (typeof hhsTesting[row.state] === 'undefined') {
          hhsTesting[row.state] = {
            state: row.state,
            date: row.date,
            total: 0,
            positive: 0,
          }
        }
        if (row.date >= hhsTesting[row.state].date) {
          hhsTesting[row.state].date = row.date
        }
      })

      Object.keys(hhsTesting).forEach((state) => {
        allData
          .filter(
            (row) => row.state === state && row.date === hhsTesting[state].date
          )
          .forEach((item) => {
            if (item.overall_outcome === 'Positive') {
              hhsTesting[state].positive = parseInt(
                item.total_results_reported,
                10
              )
            }
            hhsTesting[state].total += parseInt(item.total_results_reported, 10)
          })
      })
      fs.writeJsonSync('./_data/hhs_testing.json', Object.values(hhsTesting))
      fs.writeJsonSync('./_data/hhs_testing_notes.json', config.states)
      fs.writeJsonSync('./_data/hhs_testing_config.json', config.config)

      fs.readdir('./_hhs/data/hhs', (err, files) => {
        files.forEach((file) => {
          if (
            file.search('reported_hospital_utilization') === -1 ||
            file.search('timeseries') > -1
          ) {
            return
          }
          const fileParts = file.split('_')
          const fileDate = DateTime.fromISO(
            fileParts[fileParts.length - 2]
          ).toISODate()
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
            row.date = fileDate
            numberFields.forEach((field) => {
              if (row[field] === '') {
                row[field] = null
              }
              row[field] = parseFloat(row[field], 10)
            })
            data.push(row)
          })
        })
        fs.outputJsonSync(`./_data/hhs_hospitalization.json`, data)
        const vaccinationData = fs.readJsonSync(
          './_hhs/data/cdc_vaccinations_ltc.json'
        )
        fs.writeJsonSync(
          './_data/ltc_fed_vaccinations.json',
          vaccinationData.vaccination_ltc_data
        )
        resolve()
      })
    })
  })
}
