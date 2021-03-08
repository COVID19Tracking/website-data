const fs = require('fs-extra')
const fetch = require('node-fetch')
const parser = require('fast-xml-parser')
const { DateTime } = require('luxon')

const bucketDomain = 'covid-tracking-project-data.s3.us-east-1.amazonaws.com'
const prefix = 'state_screenshots'

module.exports = () => {
  const screenshots = []

  const parseXml = (xmlText) => {
    return new Promise((resolve, reject) => {
      try {
        resolve(parser.parse(xmlText, true))
      } catch (err) {
        reject(err)
      }
    })
  }

  const isScreenshot = (screenshot) => {
    if (
      typeof screenshot.Size === 'undefined' ||
      typeof screenshot.Key === 'undefined'
    ) {
      return false
    }
    return screenshot.Size > 0 && screenshot.Key.search(`${prefix}/`) === 0
  }

  const formatScreenshotDate = (nameSplit, format) => {
    const time = nameSplit.pop()
    const day = nameSplit.pop()
    if (isNaN(time) || isNaN(day)) {
      console.log(`Time format was wrong for ${nameSplit.join('-')}`)
      return false
    }
    const date = DateTime.fromFormat(day + time, 'yyyyLLddHHmmss', {
      zone: 'America/New_York',
    })

    if (date.toMillis() > 1615190400 * 1000) {
      console.log(`Ignore screenshot beyond March 8, 2021`)
      return false
    }

    return date.setZone('UTC')
  }

  const formatScreenshotState = (nameSplit) => {
    const state = nameSplit.shift()
    if (state.length !== 2) {
      console.log(`Could not find state in ${nameSplit.join('-')}`)
      return false
    }
    return state
  }

  const formatScreenshot = (screenshot) => {
    const url = screenshot.Key.split('/')
    const fileName = url.pop()
    const nameSplit = fileName.split('.').shift().split('-')
    const date = formatScreenshotDate([...nameSplit])
    if (!date) {
      return false
    }
    const state = formatScreenshotState([...nameSplit])

    const getType = (name) => {
      if (name.length === 3) {
        return 'primary'
      }
      return name.slice(1, -2).join(':')
    }
    const isManual = screenshot.Key.search('/manual/') > -1
    const result = {
      state,
      url: `https://covidtracking.com/screenshots/${state}${
        isManual ? '/manual' : ''
      }/${fileName}`,
      type: getType([...nameSplit]),
      isManual,
      dateChecked: date.toISO(),
      date: date.toISODate(),
      size: screenshot.Size,
    }
    if (!result.state || !result.dateChecked || !result.date) {
      return false
    }
    return result
  }

  const addScreenshot = (screenshot) => {
    if (!isScreenshot(screenshot)) {
      return false
    }
    const formattedScreenshot = formatScreenshot(screenshot)
    if (formattedScreenshot) {
      screenshots.push(formattedScreenshot)
      return formattedScreenshot
    }
    return false
  }

  const getScreenshots = (bucketDomain, marker = false) => {
    const url = `https://${bucketDomain}?prefix=${prefix}${
      marker ? `&marker=${marker}` : ''
    }`
    console.log(`Fetching ${url}`)
    return fetch(url)
      .then((response) => response.text())
      .then((data) => parseXml(data))
      .then(({ ListBucketResult }) => {
        if (!ListBucketResult) {
          return screenshots
        }
        ListBucketResult.Contents.forEach((screenshot) => {
          addScreenshot(screenshot)
        })
        if (ListBucketResult.IsTruncated) {
          return getScreenshots(
            bucketDomain,
            ListBucketResult.Contents[ListBucketResult.Contents.length - 1].Key
          )
        }
        return screenshots
      })
  }

  return new Promise((resolve, reject) => {
    getScreenshots(bucketDomain).then((data) => {
      console.log(`Fetched ${data.length} screenshots`)
      fs.writeJson('./_data/screenshots.json', data).then(() => {
        resolve()
      })
    })
  })
}
