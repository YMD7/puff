import axios from 'axios'

async function translate () {
  try {
    const host = 'api.deepl.com'
    const v = 'v2'
    const type = 'translate'
    const authKey = '6c7d20eb-ae49-7963-7ef9-20fccfd20130'
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
