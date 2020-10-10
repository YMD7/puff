const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const { WebClient } = require('@slack/web-api')
const deepl = require('./deepl')
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
  return Promise.resolve(res)
}

exports.deepPuff = async (req, res) => {
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

    // TODO: Verify Request
    res.send('OK')

    const reaction = req.body.event.reaction
    if (!/deep-puff/.test(reaction)) {
      return Promise.resolve()
    }

    const message = await getReactionedPost(req.body)
    if (message.ok) {
      const sourceText = message.messages[0].text
      const result = await deepl.translate(sourceText)
      const translation = result.data.translations[0]

      const lang = result.config.params.target_lang
      const langs = { JA: 'jp', EN: 'gb' }
      const text = '> ' + sourceText + '\n'
      await sendMessage(
        text + ':deep-puff-right: :flag-' + langs[lang] + ': _' + translation.text + '_',
        req.body.event.item.channel
      )
    }

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)

    return Promise.reject(err)
  }
}

const google = require('./google')
exports.googleAuth = functions.https.onRequest(async (req, res) => {
  try {
    console.log('Start')
    const auth = await google.auth()
    google.calendar(auth)

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)

    return Promise.reject(err)
  }
})
