const fs = require('fs-extra')
const Airtable = require('airtable')
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  'app2tJkNU6YXNrDwc'
)

module.exports = () => {
  const getAnnotations = () => {
    const annotations = []
    return new Promise((resolve, reject) => {
      base('Annotations')
        .select({
          view: 'WebView',
        })
        .eachPage(
          (records, fetchNextPage) => {
            records.forEach((record) => {
              annotations.push({
                airtable_id: record.getId(),
                state: record.get('State').shift(),
                field: record.get('States Daily Column').shift(),
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
