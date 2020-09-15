const { BigQuery } = require('@google-cloud/bigquery')
const fs = require('fs-extra')

const credentials = JSON.parse(process.env.BIGQUERY_CREDENTIALS)
const client = new BigQuery({
  projectId: credentials.project_id,
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive'],
})
const dataset = 'covid_api_export'

module.exports = async () => {
  const [tables] = await client.dataset(dataset).getTables()
  const queue = []
  tables.forEach((table) => {
    queue.push(
      new Promise(async (resolve, reject) => {
        const query = `SELECT * FROM \`${dataset}.${table.id}\``
        const [job] = await client.createQueryJob({
          query,
          location: 'US',
        })
        const [rows] = await job.getQueryResults()
        console.log(`Fetched ${rows.length} rows from bigquery ${table.id}`)

        fs.outputJson(`./_data/${table.id}.json`, rows)
        resolve(table.id)
      })
    )
  })
  return Promise.all(queue)
}
