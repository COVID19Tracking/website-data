const fs = require('fs-extra')
const Airtable = require('airtable')

module.exports = () => {
  const getAnnotations = () => {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      'appxc6svD4uHYj3FF'
    )
    const annotations = []
    return new Promise((resolve, reject) => {
      base('States')
        .select({
          view: 'Website export view',
        })
        .eachPage(
          (records, fetchNextPage) => {
            records.forEach((record) => {
              annotations.push({
                airtable_id: record.getId(),
                state: record.get('State'),
                sourcePrimary: record.get('sourcePrimary'),
                sourceSecondary: record.get('sourceSecondary'),
                sourceTertiary: record.get('sourceTertiary'),
                sourceQuaternary: record.get('sourceQuaternary'),
              })
            })
            fetchNextPage()
          },
          (error) => {
            if (error) {
              reject(error)
            }
            resolve(annotations)
          }
        )
    })
  }

  const getVaccineAnnotations = () => {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      'appVgaFHieydIMPeM'
    )
    const annotations = []
    return new Promise((resolve, reject) => {
      base('States')
        .select({
          view: 'Website export',
        })
        .eachPage(
          (records, fetchNextPage) => {
            records.forEach((record) => {
              annotations.push({
                airtable_id: record.getId(),
                state: record.get('State'),
                dashboard: record.get('Vaccine Data Dashboard'),
                planNotes: record.get('Dashboard Plans Notes'),
                planEvidence: record.get('Dashboard Plans Evidence'),
                sources: record.get('Current Data Sources'),
              })
            })
            fetchNextPage()
          },
          (error) => {
            if (error) {
              reject(error)
            }
            resolve(annotations)
          }
        )
    })
  }

  return new Promise((resolve, reject) => {
    getAnnotations()
      .then((annotations) => {
        fs.writeJsonSync('./_data/crdt_sources.json', annotations)
        console.log(`Fetched ${annotations.length} CRDT source`)
        return getVaccineAnnotations()
      })
      .then((annotations) => {
        fs.writeJsonSync('./_data/crdt_vaccine_sources.json', annotations)
        console.log(`Fetched ${annotations.length} CRDT vaccine sources`)
        resolve()
      })
      .catch((error) => {
        reject()
      })
  })
}
