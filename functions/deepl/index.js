import axios from 'axios'
require('dotenv').config()

async function translate () {
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
    const text = 'Hello'
    const targetLang = 'JA'
    const params = { auth_key: authKey, text, target_lang: targetLang }
    const res = await axios({
      method, url, headers, params
    })

    console.log('OK')
    console.log(res.data.translations)
  } catch (err) {
    console.log(err)
  }
}

translate()
