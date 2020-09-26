const { WebClient } = require('@slack/web-api')
require('dotenv').config()

const web = new WebClient(process.env.SLACK_BOT_TOKEN)

const reactionedMessage = async (body) => {
  const res = await web.conversations.history({
    channel: body.event.item.channel,
    latest: body.event.item.ts,
    inclusive: true,
    limit: 1
  })
  return res
}

exports.function = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      const error = new Error('Only POST requests are accepted')
      error.code = 405
      throw error
    }

    // Slack Event Subscriptions challenge
    if (req.body.challenge) {
      res.json({ challenge: req.body.challenge })
    }

    const message = reactionedMessage(req.body)
    if (message.ok) {
    }

    res.send('OK')
    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)

    return Promise.reject(err)
  }
}
