const fs = require('fs-extra')
const Airtable = require('airtable')

module.exports = () => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    'appxc6svD4uHYj3FF'
  )
  const getAnnotations = () => {
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

  return new Promise((resolve, reject) => {
    getAnnotations()
      .then((annotations) => {
        fs.writeJson('./_data/crdt_annotations.json', annotations).then(() => {
          console.log(`Fetched ${annotations.length} CRDT annotations notes`)

          resolve()
        })
      })
      .catch((error) => {
        reject()
      })
  })
}
