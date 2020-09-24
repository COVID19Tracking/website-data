const algoliasearch = require('algoliasearch')
const fs = require('fs-extra')

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    const client = algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.ALGOLIA_API_KEY
    )
    const facilities = await fs.readJson(
      './_data/long_term_care_facilities.json'
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
