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
//table names are Vessel-NLP for facebook
//table name for instagram is instagram




///////////// Route Handlers /////////////
app.get('/process', cors(), function(req, res){//analyzes comments on csv for facebook
processComment();
});

app.get('/processInsta', cors(), function(req, res){//analyzes comments on csv for instagram
processCommentInsta();
});



app//homepage renders dynamodb
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', function(req, res){//analyzes comments on spreadsheet
   scan.then(function(value) {
   scanInsta.then(function(data){    
    res.render('pages/index', {
        ratingArray : value,
        instagramArray : data,
    });
   });    
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


///AWS functions-Comprehend/////

function processComment(){

csvPromise.then(function(value) {
   for(var i = 0; i < value.length; i++){
       var comment = value[i].comments;
       analyze(comment);
   }
});
}

function analyze(text){
    AWS.config.update({
    accessKeyId: process.env.AWSKEY, 
    secretAccessKey:process.env.AWSSECRET, 
    region: "us-west-2"});

    var comprehend = new AWS.Comprehend();
    
    var params = {
      LanguageCode: 'en', /* required */
      Text: text /* required */
    };
    comprehend.detectSentiment(params, function(err, data) {
            var jsonString = JSON.stringify(data);
            var jsonObj = JSON.parse(jsonString);
            console.log(jsonObj.SentimentScore.Mixed);
            console.log(String(text));
            console.log(jsonObj.Sentiment);
            insertInsta(jsonObj.SentimentScore.Mixed,text,jsonObj.Sentiment);//insert into database  
    });
}


/////AWS DYNAMO//////




function createTable(){
var dynamo = require('dynamodb');
var tableName = "Vessel-NLP";

dynamo.AWS.config.update({accessKeyId: process.env.AWSKEY, 
                          secretAccessKey:process.env.AWSSECRET, 
                          region: "us-west-1"});
var dynamodb = new AWS.DynamoDB();
    
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
var dynamo = require('dynamodb');
var tableName = "Vessel-NLP";

dynamo.AWS.config.update({accessKeyId: process.env.AWSKEY, 
                          secretAccessKey:process.env.AWSSECRET, 
                          region: "us-west-1"});
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
var params = {
    TableName:'instagram',
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



var scan = new Promise(function(resolve, reject) {  
    
var ratingArray = [];
var pos = 0;//pos count
var neg = 0;//neg count
    
var dynamo = require('dynamodb');
var tableName = "Vessel-NLP";

dynamo.AWS.config.update({accessKeyId: process.env.AWSKEY, 
                          secretAccessKey:process.env.AWSSECRET, 
                          region: "us-west-1"});
var dynamodb = new AWS.DynamoDB();
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
        data.Items.forEach(function(indComment) {
           if(indComment.rating == 'POSITIVE'){
               pos++;
           }
            else{
                neg++;
            }
        });
        // continue scanning if we have more movies, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
    ratingArray.push(pos);
    ratingArray.push(neg);
    resolve(ratingArray);
}

});





//INSTAGRAM EVERYTHING//////////

var csvPromiseInsta = new Promise(function(resolve, reject) {     
    const csvFilePath='./instaComments.csv'
    const csv=require('csvtojson')
    csv()
    .fromFile(csvFilePath)
    .then((jsonObj)=>{
    resolve(jsonObj);
    })
});

function processCommentInsta(){
csvPromiseInsta.then(function(value) {
   for(var i = 0; i < value.length; i++){
       var comment = value[i].comments;
       analyzeInsta(comment);
   }
});

}

//////AWS COMPREHEND////////////////
function analyzeInsta(text){
    AWS.config.update({
    accessKeyId: process.env.AWSKEY, 
    secretAccessKey:process.env.AWSSECRET, 
    region: "us-west-2"});

    var comprehend = new AWS.Comprehend();
    
    var params = {
      LanguageCode: 'en', /* required */
      Text: text /* required */
    };
    comprehend.detectSentiment(params, function(err, data) {
            var jsonString = JSON.stringify(data);
            var jsonObj = JSON.parse(jsonString);
            console.log(jsonObj.SentimentScore.Mixed);
            console.log(String(text));
            console.log(jsonObj.Sentiment);
            insertInsta(jsonObj.SentimentScore.Mixed,text,jsonObj.Sentiment);//insert into database  
    });
}


/////AWS DYNAMO//////




function createTableInsta(){
var dynamo = require('dynamodb');
var tableName = "instagram";

dynamo.AWS.config.update({accessKeyId: process.env.AWSKEY, 
                          secretAccessKey:process.env.AWSSECRET, 
                          region: "us-west-1"});
var dynamodb = new AWS.DynamoDB();
    
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


function insertInsta(random_num, cText,rate){//insert or update function
var dynamo = require('dynamodb');
var tableName = "instagram";

dynamo.AWS.config.update({accessKeyId: process.env.AWSKEY, 
                          secretAccessKey:process.env.AWSSECRET, 
                          region: "us-west-1"});
var dynamodb = new AWS.DynamoDB();
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


var scanInsta = new Promise(function(resolve, reject) {  
    
var ratingArray = [];
var pos = 0;//pos count
var neg = 0;//neg count
var neutral = 0; //neutral or question
    
var dynamo = require('dynamodb');
var tableName = "instagram";

dynamo.AWS.config.update({accessKeyId: process.env.AWSKEY, 
                          secretAccessKey:process.env.AWSSECRET, 
                          region: "us-west-1"});
var dynamodb = new AWS.DynamoDB();
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
        data.Items.forEach(function(indComment) {
           if(indComment.rating == 'POSITIVE'){
               pos++;
           }
            else if(indComment.rating == 'NEGATIVE'){
                neg++;
            }
            else{
                neutral++;
            }
        });
        // continue scanning if we have more movies, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
    ratingArray.push(pos);
    ratingArray.push(neg);
    ratingArray.push(neutral);
    resolve(ratingArray);
}

});

///////////// Start the Server /////////////

app.listen(PORT, () => console.log(`listening on port ${PORT}`));

