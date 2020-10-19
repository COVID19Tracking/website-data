const algoliasearch = require('algoliasearch')
const fs = require('fs-extra')
const { BigQuery } = require('@google-cloud/bigquery')

const credentials = JSON.parse(process.env.BIGQUERY_CREDENTIALS)
const bigQueryClient = new BigQuery({
  projectId: credentials.project_id,
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive'],
})

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    const query = `SELECT * FROM \`long_term_care_facilities.all_states\``
    const [job] = await bigQueryClient.createQueryJob({
      query,
      location: 'US',
    })
    const [facilities] = await job.getQueryResults()
    const client = algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.ALGOLIA_API_KEY
    )
    const index = client.initIndex(process.env.ALGOLIA_LTC_FACILITY_INDEX)
    const tmpIndex = client.initIndex(
      `${process.env.ALGOLIA_LTC_FACILITY_INDEX}_tmp`
    )
    try {
      await client.copyIndex(index.indexName, tmpIndex.indexName, {
        scope: ['settings', 'synonyms', 'rules'],
      })
      await tmpIndex.saveObjects(facilities, {
        autoGenerateObjectIDIfNotExist: true,
      })
      await client.moveIndex(tmpIndex.indexName, index.indexName)
    } catch (e) {
      console.log(e)
    }
  })
}
