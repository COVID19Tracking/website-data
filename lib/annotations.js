const fs = require('fs-extra')
const Airtable = require('airtable')
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  'app2tJkNU6YXNrDwc'
)

module.exports = () => {
  const definitions = []
  const annotations = []
  const metrics = []

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
                definitions: definitions.filter((definition) => {
                  if (!record.get('Annotation')) {
                    return false
                  }
                  return (
                    record.get('Annotation').indexOf(definition.airtable_id) >
                    -1
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
            resolve()
          }
        )
    })
  }

  const getMetrics = () => {
    return new Promise((resolve, reject) => {
      base('Metrics')
        .select({
          view: 'Main View',
        })
        .eachPage(
          (records, fetchNextPage) => {
            records.forEach((record) => {
              metrics.push({
                airtable_id: record.getId(),
                state: record.get('State'),
                metric: record.get('Metric'),
                type: record.get('Metric Type'),
                field: record.get('States Daily Column'),
                annotations: annotations.filter((definition) => {
                  if (!record.get('Annotations')) {
                    return false
                  }
                  return (
                    record.get('Annotations').indexOf(definition.airtable_id) >
                    -1
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
            resolve()
          }
        )
    })
  }

  return new Promise((resolve, reject) => {
    getDefinitions()
      .then(() => {
        return getAnnotations()
      })
      .then(() => {
        return getMetrics()
      })
      .then(() => {
        fs.writeJson('./_data/annotations.json', metrics).then(() => {
          console.log(`Fetched ${metrics.length} annotations`)

          resolve()
        })
      })
      .catch(() => {
        reject()
      })
  })
}
