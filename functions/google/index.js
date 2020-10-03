const admin = require('firebase-admin')

const db = admin.firestore()

exports.auth = async () => {
  try {
    const ref = db.collection('google-api').doc('credential')
    ref.get().then(doc => {
      console.log(doc.data())
    })

    return Promise.resolve()
  } catch (err) {
    console.error(err)

    return Promise.reject(err)
  }
}
