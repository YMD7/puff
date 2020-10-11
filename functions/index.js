require('dotenv').config()

/*
 * Firebase
 */
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

/*
 * Slack
 */
const { WebClient } = require('@slack/web-api')
const web = new WebClient(process.env.SLACK_BOT_TOKEN)

const slackSendMessage = async (text, channel) => {
  const res = await web.chat.postMessage({
    text, channel
  })
  return Promise.resolve(res)
}

/*
 * DeepL
 */
const deepl = require('./deepl')

/*
 * Google
 */
const google = require('./google')

/*
 * Day.js
 */
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Tokyo')

/******************************
 * Deep Puff
 ******************************/
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
      await slackSendMessage(
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

const getReactionedPost = async (body) => {
  const res = await web.conversations.history({
    channel: body.event.item.channel,
    latest: body.event.item.ts,
    inclusive: true,
    limit: 1
  })
  return Promise.resolve(res)
}

/******************************
 * Puff Lunch
 ******************************/
exports.puffLunch = functions.https.onRequest(async (req, res) => {
  try {
    // const puffLunchDate = await getNextPuffLunch()
    // const timeMin = new Date(dayjs.tz(puffLunchDate).hour(12).minute(30))
    // const timeMax = new Date(dayjs.tz(puffLunchDate).hour(13).minute(30))
    // const regulars = await getRegularMembers()
    // const availables = await getAvailables(regulars, { timeMin, timeMax })
    const lunchMembers = await lottery(availables, 4)
    const text = 'test'
    const channel = 'GALKKHGTS' // #onion-test
    await slackSendMessage(text, channel)

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)

    return Promise.reject(err)
  }
})

const getNextPuffLunch = async () => {
  const d = new Date()
  const day = dayjs.tz(d)
  let n = day.add(1, 'day')

  const nDay = n.day()
  if (nDay === 6) n = n.add(2, 'day')

  const nextDay = await getNextPuffLunchDate(n)
  return new Date(nextDay.format())
}

const getNextPuffLunchDate = async (d) => {
  const calendar = await google.calendar()
  const timeMin = new Date(d.startOf('date').format())
  const timeMax = new Date(d.endOf('date').format())
  const res = await calendar.events.list({
    calendarId: 'ja.japanese#holiday@group.v.calendar.google.com',
    singleEvents: true,
    timeMin,
    timeMax
  })
  if (res.data.items.length) d = await getNextPuffLunchDate(d.add(1, 'day'))

  return Promise.resolve(d)
}

const getRegularMembers = async () => {
  const calendar = await google.calendar()
  const res = await calendar.calendarList.list()
  const calendarList = res.data.items
  const expections = [
    'android.device@edocode.co.jp', 'akasaka.a@edocode.co.jp'
  ]
  const ids = []
  for (const cal of calendarList) {
    if (/@edocode.co.jp/.test(cal.id) && expections.indexOf(cal.id) === -1) {
      ids.push(cal.id)
    }
  }

  return Promise.resolve(ids)
}

const getAvailables = async (ids, times) => {
  const { timeMin, timeMax } = times
  const calendar = await google.calendar()
  const availables = ids.slice(0)
  for (const calendarId of ids) {
    const res = await calendar.events.list({
      calendarId,
      singleEvents: true,
      timeMin,
      timeMax
    })
    const events = res.data.items
    if (events.length > 0) {
      for (const event of events) {
        if (event.start.date) {
          if (/休暇|休み/.test(event.summary)) {
            const index = availables.indexOf(calendarId)
            availables.splice(index, 1)
            break
          }
        } else {
          const index = availables.indexOf(calendarId)
          availables.splice(index, 1)
          break
        }
      }
    }
  }

  return Promise.resolve(availables)
}

const lottery = (ids, cap) => {
  while (ids.length > cap) {
    const i = Math.floor(Math.random() * ids.length)
    ids.splice(i, 1)
  }

  return Promise.resolve(ids)
}
