/*
 * TODO:
 * - deepPuff, puffLunch 両方の関数が一つの index.js で動かせるようにする
 * - いまの状態だと、Puff アプリの Slack Bot Token しか使えない
 * - なので、Slack SDK の初期化を2つに分けて使えるか試してみる
 *
 */

/* functions/index.js */

/*
 * Firebase
 */
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://e-puff.firebaseio.com'
})

/*
 * Slack
 */
const { WebClient } = require('@slack/web-api')
const web = new WebClient(functions.config().slack.bot_token)

const slackSendMessage = async (text, channel) => {
  const res = await web.chat.postMessage({
    text, channel
  })
  return Promise.resolve(res)
}

const getSlackIds = async (emails) => {
  const ids = []
  for (const email of emails) {
    const res = await web.users.lookupByEmail({ email })
    res.ok ? ids.push(res.user.id) : ids.push(email)
  }
  return Promise.resolve(ids)
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
exports.deepPuff = functions.region('asia-northeast1').https.onRequest(async (req, res) => {
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
      console.log(sourceText)

      const result = await deepl.translate(sourceText)
      const translation = result.data.translations[0]
      console.log(translation)

      const lang = result.config.params.target_lang
      const langs = { JA: 'jp', EN: 'gb' }
      const text = '> ' + sourceText + '\n'

      const sendResult = await slackSendMessage(
        text + ':deep-puff-right: :flag-' + langs[lang] + ': _' + translation.text + '_',
        req.body.event.item.channel
      )
      console.log(sendResult)
    }

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)

    return Promise.reject(err)
  }
})

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
const cron = 'every mon,tue,wed,thu,fri 14:00'
const tz = 'Asia/Tokyo'
exports.puffLunchCron = functions.pubsub.schedule(cron).timeZone(tz).onRun(async () => {
  const calendar = await google.calendar()
  const timeMin = new Date(dayjs.tz().startOf('date'))
  const timeMax = new Date(dayjs.tz().endOf('date'))
  console.log('Today is [ ' + dayjs.tz().format('YYYY/MM/DD ddd') + ' ].')

  const response = await calendar.events.list({
    calendarId: 'ja.japanese#holiday@group.v.calendar.google.com',
    singleEvents: true,
    timeMin,
    timeMax
  })
  if (response.status !== 200) {
    console.log('The Calendar of Japanese Holiday did not return 200, then the function stopped.')
    return null
  }

  if (response.data.items.length) {
    console.log('Today is holiday! :D')
    return null
  }

  console.log('Kick Puff to post lunch!')
  module.exports.puffLunch()
  return null
})

exports.puffLunch = functions.region('asia-northeast1').https.onRequest(async (req, res) => {
  try {
    const puffLunchDate = await getNextPuffLunch()
    const startTime = dayjs.tz(puffLunchDate).hour(12).minute(30)
    const endTime = dayjs.tz(puffLunchDate).hour(13).minute(30)
    const timeMin = new Date(startTime)
    const timeMax = new Date(endTime)

    const regulars = await getRegularMembers()
    const availables = await getAvailables(regulars, { timeMin, timeMax })
    const participants = await lottery(availables, 4)
    const userIds = await getSlackIds(participants)

    const text = await getPuffLunchText(userIds, startTime, endTime)
    const channel = functions.config().slack.channel_id.e_random
    const slackResponse = await slackSendMessage(text, channel)
    console.log(text)

    if (slackResponse.ok) {
      const message = 'Puff posted the message!'
      console.log('--------------------------')
      console.log(' ' + message)
      console.log('--------------------------')

      res.status(200).send(message)
      return Promise.resolve()
    } else {
      console.log('Slack chat.postMessage API responded error XO')
      res.status(500).send(slackResponse.error)
      return Promise.reject(slackResponse.error)
    }
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

const getPuffLunchText = async (ids, startTime, endTime) => {
  /*
   * Header of text
   */
  const date = dayjs.tz(startTime).hour(0).minute(0).second(0)
  const now = dayjs.tz().hour(0).minute(0).second(0)
  const daysAfter = Math.round(date.diff(now, 'day', true))
  const dayNames = ['', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日']

  let nextLunchTime = '次回'
  const weeks = Math.round(date.diff(now, 'week'))
  switch (daysAfter < 3) {
    case true:
      if (daysAfter === 1) nextLunchTime = '明日'
      if (daysAfter === 2) nextLunchTime = 'あさって'
      break

    case false:
      if (weeks === 0) {
        if (now.day() < date.day()) nextLunchTime = dayNames[date.day()]
        if (now.day() >= date.day()) nextLunchTime = '来週' + dayNames[date.day()]
      }
      if (weeks === 1) {
        if (now.day() < date.day()) nextLunchTime = '来週' + dayNames[date.day()]
        if (now.day() >= date.day()) nextLunchTime = '再来週' + dayNames[date.day()]
      }
      if (weeks === 2) {
        if (now.day() < date.day()) nextLunchTime = '再来週' + dayNames[date.day()]
      }
      break

    default:
      break
  }
  let text = ':broccoli: ' + nextLunchTime + 'のランチ :broccoli:\n\n'

  /*
   * Body of text
   */
  if (ids.length === 0) {
    text += ':puff_right::sweat_drops: ん〜〜〜 この時間帯は誰も空いてないみたいだ〜〜 :man-gesturing-no:\n他の時間帯とかはどうか試してみてはどうかな！:point_up::puff:'
  } else if (ids.length < 4) {
    let users = ''
    for (const id of ids) {
      users = users + '<@' + id + '>さん\n'
    }
    text += ':puff_right: おしいっ:bangbang: :puff:\n' + users + 'は空いてるみたいなんだけど、あと ' + (4 - ids.length) + '人いないと 4人で行けない〜:dizzy_face:\n残念だけど、また別の機会だね〜〜 :raised_hands:'
  } else {
    const date =
      startTime.year() + '/' + (startTime.month() + 1) + '/' + startTime.date() +
      '(' + ['日', '月', '火', '水', '木', '金', '土'][startTime.day()] + ')'
    const startEnd =
      startTime.hour() + ':' +
      (startTime.minute() < 10 ? '0' + startTime.minute() : startTime.minute()) +
      ' - ' +
      endTime.hour() + ':' +
      (endTime.minute() < 10 ? '0' + endTime.minute() : endTime.minute())

    text += ':v: こちらの皆さんでどうですか〜！\n\n:curry: <@' + ids[0] + '>（ホスト）\n:bento: <@' + ids[1] + '>\n:hamburger: <@' + ids[2] + '>\n:coffee: <@' + ids[3] + '>\n\n> :spiral_calendar_pad: ' + date + ' ' + startEnd + ' :call_me_hand:\nこの予定でいけるか、:o: or :x: でリアクションしてくれよ〜！:puff_right::+1:\n'
  }

  /*
   * If any member has not resistered email on Slack
   */
  const membersNotResisteredEmail = text.match(/<@[a-z]+\.[a-z]+@edocode\.co\.jp>/g)

  if (membersNotResisteredEmail !== null) {
    let byTheWay = '\nちなみに、'
    for (const member of membersNotResisteredEmail) {
      const target = member.match(/@[a-z]+\.[a-z]+/)[0]
      text = text.replace(member, '`' + target + '`')
      byTheWay = byTheWay + ' `' + target + '`' + ' さん、'
    }
    byTheWay = byTheWay.replace(/、$/, '') + 'は Slack のユーザーとしてメールアドレスが登録されてないですよ！'
    text = text + byTheWay
  }

  return Promise.resolve(text)
}
