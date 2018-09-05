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
const scopes = 'write_products';
//const appUrl = 'https://preorder-app.herokuapp.com';
const appUrl = 'https://preorder-app.herokuapp.com';
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





//functions to send mail through regular gmail in case Mandrill runs out of mail sends



///////////// Start the Server /////////////

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

