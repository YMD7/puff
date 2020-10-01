const Firestore = require('@google-cloud/firestore')

const db = new Firestore({
  projectId: 'e-puff',
  keyFilename: 'keyfile.json'
})

exports.auth = async () => {
  try {
    const credential = db.collection('google-api').doc('credential')
    await credential.set({
      client_id: 'CLIENT_ID',
      client_secret: 'CLIENT_SECRET',
      redirect_uris: 'REDIRECT_URIS'
    })

    return Promise.resolve()
  } catch (err) {
    console.error(err)

    return Promise.reject(err)
  }
}
