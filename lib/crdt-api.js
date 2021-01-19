const fs = require('fs-extra')
const Airtable = require('airtable')

module.exports = () => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    'appxc6svD4uHYj3FF'
  )
  const getAnnotations = () => {
    const annotations = []
    return new Promise((resolve, reject) => {
      base('API Headers')
        .select({
          view: 'Grid view',
        })
        .eachPage(
          (records, fetchNextPage) => {
            records.forEach((record) => {
              annotations.push({
                airtable_id: record.getId(),
                fieldName: record.get('fieldName'),
                type: record.get('type'),
                title: record.get('title'),
                description: record.get('description'),
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
        fs.writeJson('./_data/crdt_api.json', annotations).then(() => {
          console.log(`Fetched ${annotations.length} CRDT API notes`)

          resolve()
        })
      })
      .catch((error) => {
        console.log(error)
        reject()
      })
  })
}
