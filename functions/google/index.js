/* functions/google/index.js */

const functions = require('firebase-functions')
const { google } = require('googleapis')

/******************************
 * Google OAuthClient
 ******************************/
exports.auth = async (scopes) => {
  try {
    const auth = new google.auth.JWT({
      keyFile: './keyfile.json',
      scopes,
      subject: functions.config().google.delegated_user
    })

    return Promise.resolve(auth)
  } catch (err) {
    console.error(err)

    return Promise.reject(err)
  }
}

/******************************
 * Google APIs
 ******************************/
exports.apis = async (name, version, scopes) => {
  console.log(`Preparing Google ${name} API`)
  const auth = await module.exports.auth(scopes)
  const service = await google[name]({ version, auth })

  return Promise.resolve(service)
}
