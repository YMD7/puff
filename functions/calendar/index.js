const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPE = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.readonly'
];
const TOKEN_PATH = 'token.json';
const CREDENTIAL_PATH = 'credentials.json';

const authorize = ( credentials, callback ) => {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, ( err, token ) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
};

const getAccessToken = ( oAuth2Client, callback ) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPE
  });
  console.log('Authorize this app by visitiong this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', ( code ) => {
    rl.close();
    oAuth2Client.getToken(code, ( err, token ) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), ( err ) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
};

const listEvents = ( auth ) => {
  const calendar = google.calendar({ version: 'v3', auth });
  calendar.events.list({
    calendarId: 'tamura.t@edocode.co.jp',
    singleEvents: true,
    timeMin: new Date('2020-09-14 12:30'),
    timeMax: new Date('2020-09-14 14:00')
  }, ( err, res ) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    console.log(events);
  });
}

fs.readFile(CREDENTIAL_PATH, ( err, content ) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), listEvents);
});


// exports.function = async (req, res) => {
//   fs.readFile('credentials.json', ( err, content ) => {
//     if (err) return console.log('Error loading client secret file:', err);
//     authorize(JSON.parse(content), listEvents);
//   });
//
//   res.send('hello');
//   return Promise.resolve();
// };

