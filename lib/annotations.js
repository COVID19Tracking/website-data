const fs = require('fs-extra')
const Airtable = require('airtable')
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  'app2tJkNU6YXNrDwc'
)

const definitions = []

const getDefinitions = () => {
  return new Promise((resolve, reject) => {
    base('Definitions')
      .select({
        view: 'Grid view',
      })
      .eachPage(
        (records, fetchNextPage) => {
          records.forEach((record) => {
            definitions.push({
              airtable_id: record.getId(),
              name: record.get('Name'),
              type: record.get('Definition Type'),
              definition: record.get('Definition'),
            })
          })
          fetchNextPage()
        },
        (error) => {
          if (error) {
            reject(error)
          }
          resolve(definitions)
        }
      )
  })
}

const getAnnotations = () => {
  const annotations = []
  return new Promise((resolve, reject) => {
    base('Annotations')
      .select({
        view: 'Main View',
      })
      .eachPage(
        (records, fetchNextPage) => {
          records.forEach((record) => {
            annotations.push({
              airtable_id: record.getId(),
              state: record.get('State'),
              summary: record.get('Annotation Summary'),
              type: record.get('Evidence Type'),
              evidence: record.get('Evidence'),
              evidence_source: record.get('Evidence Source'),
              annotation: definitions.filter((definition) => {
                if (!record.get('Annotation')) {
                  return false
                }
                return (
                  record.get('Annotation').indexOf(definition.airtable_id) > -1
                )
              }),
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

module.exports = () => {
  return new Promise((resolve, reject) => {
    getDefinitions()
      .then(() => {
        return getAnnotations()
      })
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
