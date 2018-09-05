const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 3000
const dotenv = require('dotenv').config();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const axios = require('axios');
const request = require('request-promise');
var cors = require('cors');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
//mandrill
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');
//authentication
var basicAuth = require('basic-auth');

const app = express();

const appUrl = 'https://vessel-nlp.herokuapp.com';
//body parser
app.use(bodyParser.urlencoded({ extended: false })) 

app.use(bodyParser.json());


//enable CORS 
app.use(cors())





///////////// Route Handlers /////////////

app//homepage
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
//////////////SpreadSheets//////////////////



////////google spreadsheet functions///////


// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.

var content =
{"installed":{"client_id":process.env.sheet_client_id,"project_id":process.env.sheet_project_id,"auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://www.googleapis.com/oauth2/v3/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":process.env.sheet_client_secret,"redirect_uris":["urn:ietf:wg:oauth:2.0:oob","http://localhost"]}};

function authorize(credentials,func) {//synchronous authentication
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  var token = fs.readFileSync(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
      return func(oAuth2Client);
    
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */


//Appends Data to SpreadSHeet Automatically
async function autoAppend(auth) {//appends data from firebase to spreadsheet 
  var sheets = google.sheets('v4');

  sheets.spreadsheets.values.append({
    auth: auth,
    spreadsheetId: '1UfkW7D45p_idIEB-93gsSJvfxiCLamJysrblS8-IaM0',
    range: 'Sheet1', //Change Sheet1 if your worksheet's name is something else
    valueInputOption: "USER_ENTERED",
    resource: {
     values: tempValue
    }
  }, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    } else {
        console.log("Appended");
    }
  });
  
 
}


async function readAllCustomers(auth) {//reads all customers from google sheet
  var result_array = [];
  const sheets = google.sheets({version: 'v4', auth});
    result_array = await new Promise(function(resolve, reject) {
  sheets.spreadsheets.values.get({
    spreadsheetId: '1UfkW7D45p_idIEB-93gsSJvfxiCLamJysrblS8-IaM0',
    range: 'Sheet1',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    resolve(rows);
    if (rows.length) {
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        //console.log(`${row[0]}, ${row[1]},${row[2]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
});
    return(result_array); //returns an json of spreadsheet
}


function deleteCustomers(auth) {//reads all customers from google sheet
  const sheets = google.sheets({version: 'v4', auth});
    
    sheets.spreadsheets.values.get({
    spreadsheetId: '1UfkW7D45p_idIEB-93gsSJvfxiCLamJysrblS8-IaM0',
    range: 'Sheet1',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    var blank = [] 
    for(var i = 0; i < (rows.length - 1); i++){
        blank.push(["","",""]);
    sheets.spreadsheets.values.update({//update spreadsheet with blanks
    auth: auth,
    spreadsheetId: '1UfkW7D45p_idIEB-93gsSJvfxiCLamJysrblS8-IaM0',
    range: 'A2', //Change Sheet1 if your worksheet's name is something else
    valueInputOption: "USER_ENTERED",
    resource: {
     values: blank
    }
  }, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    } else {
        console.log("Deleted!");
    }
  });
    }
    if (rows.length) {//rows.length - 1 corresponds to number of rows
      
      rows.map((row) => {
        //console.log(`${row[0]}, ${row[1]},${row[2]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
  
}




///////////// Start the Server /////////////

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

