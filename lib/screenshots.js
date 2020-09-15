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
      console.log(`Time format was wrong for ${name}`)
      return false
    }
    const date = DateTime.fromFormat(day + time, 'yyyyLLddHHmmss', {
      zone: 'America/New_York',
    })

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

  const isValidScreenshotName = (nameSplit) => {
    if (nameSplit.length < 3 || nameSplit.length > 4) {
      console.log(`File name invalid ${nameSplit.join('-')}`)
      return false
    }
    if (
      nameSplit.length === 4 &&
      ['secondary', 'tertiary'].indexOf(nameSplit[1]) === -1
    ) {
      console.log(
        `File second position not secondary or tertiary label in ${nameSplit.join(
          '-'
        )}`
      )
      return false
    }
    return true
  }

  const formatScreenshot = (screenshot) => {
    const url = screenshot.Key.split('/')
    const fileName = url.pop()
    const nameSplit = fileName.split('.').shift().split('-')
    const isSecondary = nameSplit[1] === 'secondary'
    const isTertiary = nameSplit[1] === 'tertiary'
    if (!isValidScreenshotName(nameSplit)) {
      return false
    }
    const date = formatScreenshotDate(nameSplit)
    const state = formatScreenshotState(nameSplit)
    const result = {
      state,
      url: `https://${bucketDomain}/${screenshot.Key}`,
      secondary: isSecondary,
      tertiary: isTertiary,
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
