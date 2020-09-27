const { WebClient } = require('@slack/web-api')
const deepl = require('./functions/deepl')
require('dotenv').config()

const web = new WebClient(process.env.SLACK_BOT_TOKEN)

const reactionedMessage = async (body) => {
  const res = await web.conversations.history({
    channel: body.event.item.channel,
    latest: body.event.item.ts,
    inclusive: true,
    limit: 1
  })
  return Promise.resolve(res)
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

    console.log('start')
    const message = await reactionedMessage(req.body)
    console.log(message)
    if (message.ok) {
      console.log('message OK')
      const translation = await deepl.translate(message)
      console.log('translate OK')
      console.log(translation)
    }

    console.log('res OK')
    res.send('OK')
    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)

    return Promise.reject(err)
  }
}
