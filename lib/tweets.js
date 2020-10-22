const Twitter = require('twitter')
const fs = require('fs-extra')

const client = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET,
  access_token_key: process.env.TWITTER_API_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_API_TOKEN_SECRET,
})

const tweets = []
let since = false

const getTweets = (callback) => {
  client
    .get('statuses/user_timeline', {
      screen_name: 'COVID19Tracking',
      trim_user: true,
      count: 200,
      tweet_mode: 'extended',
      max_id: since ? since : undefined,
    })
    .then((result) => {
      tweets.push(...result)
      if (result.length === 200) {
        since = result[result.length - 1].id
        getTweets(callback)
      } else {
        callback()
      }
    })
    .catch((e) => {
      console.log(e)
    })
}

module.exports = () => {
  return new Promise((resolve, reject) => {
    getTweets(() => {
      console.log(`Fetched ${tweets.length} tweets`)
      fs.writeJson('./_data/tweets.json', tweets).then(() => {
        resolve(tweets.length)
      })
    })
  })
}
