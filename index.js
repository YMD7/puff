const { WebClient } = require('@slack/web-api')
const deepl = require('./functions/deepl')
require('dotenv').config()

const web = new WebClient(process.env.SLACK_BOT_TOKEN)

const getReactionedPost = async (body) => {
  const res = await web.conversations.history({
    channel: body.event.item.channel,
    latest: body.event.item.ts,
    inclusive: true,
    limit: 1
  })
  return Promise.resolve(res)
}
const sendMessage = async (text, channel) => {
  const res = await web.chat.postMessage({
    text, channel
  })
  console.log(res)
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

    // Verify Request
    res.send('OK')

    const message = await getReactionedPost(req.body)
    if (message.ok) {
      const translation = await deepl.translate(message)
      console.log(translation)
      const sendResult = await sendMessage(translation[0].text, req.body.event.item.channel)
      console.log(sendResult)
    }

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)

    return Promise.reject(err)
  }
}
