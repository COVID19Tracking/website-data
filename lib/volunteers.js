const { WebClient } = require('@slack/web-api')
const fs = require('fs-extra')

let allUsers = []
const allVolunteers = []
let currentVolunteer = 0

const slackClient = new WebClient(global.SLACK_TOKEN || process.env.SLACK_TOKEN)

const profileFields = {
  listUser: {
    id: 'Xf011X160CGK',
    value: 'Yes, add me to the public volunteer web page',
  },
  name: 'Xf0122V6KCN8',
  website: 'Xf0129DFHP4Z',
}

const getUserProfiles = (users) => {
  return slackClient.users.profile
    .get({
      user: users[currentVolunteer].id,
    })
    .then((response) => {
      if (response.profile && response.profile.fields) {
        const { fields } = response.profile
        if (
          profileFields.listUser.id in fields &&
          fields[profileFields.listUser.id].value ===
            profileFields.listUser.value
        ) {
          const volunteer = fields[profileFields.name]
            ? {
                name: fields[profileFields.name].value,
                website: fields[profileFields.website]
                  ? fields[profileFields.website].value
                  : '',
              }
            : false
          if (volunteer) {
            allVolunteers.push(volunteer)
          }
        }
      }
      currentVolunteer++
      if (typeof users[currentVolunteer] !== 'undefined') {
        return getUserProfiles(users)
      }
      return allVolunteers
    })
    .catch((error) => {
      console.error(`Slack API error when fetching profile ${error}`)
      process.exit(1)
    })
}

const getUsers = (cursor) => {
  return slackClient.users
    .list({ limit: 100, cursor: cursor })
    .then((response) => {
      if (!response.ok) {
        console.error(`Slack API error`)
        throw new Error('Slack API error')
      }
      allUsers = allUsers.concat(response.members)
      if (response.response_metadata.next_cursor) {
        return getUsers(response.response_metadata.next_cursor)
      }
      console.log(`Downloaded slack users ${allUsers.length}`)
      return allUsers
    })
    .catch((error) => {
      console.error(`Slack API error ${error}`)
    })
}

module.exports = () => {
  return new Promise((resolve, reject) => {
    getUsers()
      .then((users) => getUserProfiles(users))
      .then((volunteers) => {
        fs.writeJson('./_data/volunteers.json', volunteers).then(() => {
          resolve(volunteers.length)
        })
      })
      .catch(() => {
        reject()
      })
  })
}
