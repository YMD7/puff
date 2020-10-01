const axios = require('axios')
require('dotenv').config()

exports.translate = async (source, targetLang = 'JA') => {
  try {
    const host = 'api.deepl.com'
    const v = 'v2'
    const type = 'translate'
    const authKey = process.env.DEEPL_AUTH_KEY
    const url = 'https://' + host + '/' + v + '/' + type

    const method = 'POST'
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    const text = source.replace(/<@\w+>/g, '')
    const params = { auth_key: authKey, text, target_lang: targetLang }
    const res = await axios({
      method, url, headers, params
    })

    console.log('DeepL OK')
    return Promise.resolve(res.data.translations)
  } catch (err) {
    console.log(err)
  }
}
