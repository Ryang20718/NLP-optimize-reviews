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
var AWS = require("aws-sdk");
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

app.get('/getAllCustomersSheets', cors(), function(req, res){//shows all customers email on spreadsheet
authorize(content,readAllCustomers).then(function(value) {//value is an array
    res.send(value);
});
});


///CSV FUNCTIONS////////


var csvPromise = new Promise(function(resolve, reject) {     
const csvFilePath='./out.csv'
const csv=require('csvtojson')
csv()
.fromFile(csvFilePath)
.then((jsonObj)=>{
resolve(jsonObj);
})
});


csvPromise.then(function(value) {
   for(var i = 0; i < value.length; i++){
       txtArray.push(value[i].comments);
   }
 });

///AWS functions-Comprehend/////

AWS.config.update({
  accessKeyId: process.env.AWSKEY, 
  secretAccessKey:process.env.AWSSECRET, 
  region: "us-west-2"});

var comprehend = new AWS.Comprehend();
comprehend.batchDetectDominantLanguage(params, function (err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});

var params = {
  LanguageCode: 'en', /* required */
  Text: "Weekend travel inspiration. Where will your next adventure be?" /* required */
};
comprehend.detectSentiment(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});






/////AWS DYNAMO//////

var dynamo = require('dynamodb');
var tableName = "Vessel-NLP";

dynamo.AWS.config.update({accessKeyId: process.env.AWSKEY, 
                          secretAccessKey:process.env.AWSSECRET, 
                          region: "us-west-1"});
var dynamodb = new AWS.DynamoDB();


function createTable(){
var params = {
    TableName : tableName,
    KeySchema: [       
        { AttributeName: "num", KeyType: "HASH"}  //Partition key
    ],
    AttributeDefinitions: [       
        { AttributeName: "num", AttributeType: "N" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
};

function insert(random_num, cText,rate){//insert or update function
var docClient = new AWS.DynamoDB.DocumentClient();
var params = {
    TableName:tableName,
    Item:{
        "num": random_num,
        "comment":cText,
        "rating":rate,
    }
};
console.log("Adding a new item...");
docClient.put(params, function(err, data) {
    if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
    }
});
};

function scan(){

var docClient = new AWS.DynamoDB.DocumentClient();
var params = {
    TableName: tableName,
};

console.log("Scanning table.");
docClient.scan(params, onScan);

function onScan(err, data) {
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        // print all the movies
        console.log("Scan succeeded.");
        data.Items.forEach(function(rating) {
           console.log(
                rating.num);
        });

        // continue scanning if we have more movies, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
}
};

///////////// Start the Server /////////////

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

