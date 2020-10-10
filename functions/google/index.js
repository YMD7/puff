const { google } = require('googleapis')
const admin = require('firebase-admin')

const db = admin.firestore()

const getDocData = async (ref) => {
  return await ref.get()
    .then(doc => {
      return doc.exists ? doc.data() : console.log('No such document!')
    })
    .catch(err => {
      console.error('Error getting document', err)
    })
}

exports.auth = async () => {
  try {
    const cRef = await db.collection('google-api').doc('credential')
    const credential = await getDocData(cRef)
    const tRef = await db.collection('google-api').doc('token')
    const token = await getDocData(tRef)

    const oAuth2Client = new google.auth.OAuth2(
      credential.client_id, credential.client_secret, credential.redirect_uris[0]
    )
    oAuth2Client.setCredentials(token)

    return Promise.resolve(oAuth2Client)
  } catch (err) {
    console.error(err)

    return Promise.reject(err)
  }
}

exports.calendar = async (auth) => {
  const calendar = google.calendar({ version: 'v3', auth })
  calendar.events.list({
    calendarId: 'tamura.t@edocode.co.jp',
    singleEvents: true,
    timeMin: new Date('2020-09-14 12:30'),
    timeMax: new Date('2020-09-14 14:00')
  }, (err, res) => {
    if (err) return console.log(`The API returned an error: ${err}`)
    const events = res.data.items
    console.log(events)
  })
}
