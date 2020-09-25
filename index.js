require('dotenv').config()
const { App } = require('@slack/bolt')

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
})

exports.function = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      const error = new Error('Only POST requests are accepted')
      error.code = 405
      throw error
    }

    const response = {
      challenge: req.body.challenge
    }
    res.json(response)

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
}
