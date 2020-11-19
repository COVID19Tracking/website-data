const fs = require('fs-extra')
const Airtable = require('airtable')

module.exports = () => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    'appgP55CLDn16S6NH'
  )
  const getAnnotations = () => {
    const annotations = []
    return new Promise((resolve, reject) => {
      base('WebView')
        .select({
          view: 'Grid view',
        })
        .eachPage(
          (records, fetchNextPage) => {
            records.forEach((record) => {
              annotations.push({
                airtable_id: record.getId(),
                state: record.get('State'),
                field: record.get('States Daily Column'),
                lastChecked: record.get('Last Checked'),
                warning: record.get('WebFlag'),
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
        fs.writeJson('./_data/annotations.json', annotations).then(() => {
          console.log(`Fetched ${annotations.length} annotations`)

          resolve()
        })
      })
      .catch(() => {
        reject()
      })
  })
}
