/* functions/google/index.js */

const { google } = require('googleapis')

/******************************
 * Google OAuthClient
 ******************************/
exports.auth = async (scopes) => {
  try {
    const auth = new google.auth.JWT({
      keyFile: './keyfile.json',
      scopes,
      subject: 'kato.a@edocode.co.jp'
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
