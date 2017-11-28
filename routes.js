"use strict";

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var axios = require('axios');
var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
var _ = require('underscore');
var weather = require('weather-js');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var path = require("path");

var publicPath = path.resolve(__dirname, 'public');

// Serve this path with the Express static file middleware.
var app = express();
app.use(express.static(publicPath));


mongoose.Promise = global.Promise;
var TOKEN_DIR = path.resolve(__dirname) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail_token.json';
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var axios = require('axios');

router.get('/', function(req, res) {
  weather.find({search: 'Waterville, ME', degreeType: 'F'}, function(err, result) {
    if(err) {
      res.status(400).send({"error": "could not save data"})
    };
    console.log(result[0].forecast)
    const weather = {
      low: result[0].forecast[0].low,
      high: result[0].forecast[0].high,
      text: result[0].forecast[0].skytextday
    }
    console.log(weather)
    res.render('initial', {weather: weather})

  });
})

router.get('/email', function(req, res) {

  var clientSecret = "81_OzkfoU862dE6IZNYgcgac";
  var clientId = "63923800462-mg0dssa8meh773i1kheqk0uiamoldonr.apps.googleusercontent.com";
  var redirectUrl = "urn:ietf:wg:oauth:2.0:oob";
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  fs.readFile(TOKEN_PATH, function(err, token) {
    //console.log(res)
    if (err) {
      getNewToken(oauth2Client, listLabels, res);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      listLabels(oauth2Client, res);
    }
  })
})

var getNewToken = function(oauth2Client, callback, res) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, res);
    });
  });
}

var storeToken = function(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

var listLabels = function(auth, res) {
  var gmail = google.gmail('v1');
  var messages_snippet = [];
  var dt = new Date();
  var ampm = 'pm';
  if (dt.getHours() / 12 < 1) {
    ampm = 'am'
  }
  var curTime = ((dt.getHours()) % 12) + ":" + zeroFill(dt.getMinutes(),2) + ' '+ ampm;
  var curDate = dt.getDate() + "-" + dt.getMonth() + "-" + dt.getFullYear();
  gmail.users.messages.list({
    auth: auth,
    userId: 'me',
    maxResults: 10,
    q:'is:unread',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var messages = response.messages;
    if (messages == null) {
      console.log('No messages found.');
      res.render('email',{message: '', time:curTime, date: curDate})
    } else {
      var promises = [];
      messages.forEach((mes) => {
        promises.push(getEachMessage(auth, mes.id, messages_snippet))
      })
      Promise.all(promises)
      .then(() => {
        console.log('yo yo ')
        console.log(messages_snippet);
        res.render('email', {message: messages_snippet, time:curTime, date: curDate})

      })
      .catch((err) => {
        console.log(err);
        console.log('Oops')
      })

    }
  });
}

var getEachMessage = function(auth, messageId, messages) {
  var gmail = google.gmail('v1');
  return new Promise(function(resolve, reject) {
    gmail.users.messages.get({
      auth: auth,
      'userId': 'me',
      'id': messageId,
      'format': 'metadata'
    }, function(err, response) {
      if (err) console.log(err)
      console.log(response.payload.headers)
      messages.push([response.payload.headers.find(findHeader)["value"],response.snippet,response.payload.headers.find(findAuthor)["value"]]);
      resolve();
    })
  })
}
module.exports = router;
function findHeader(element) {
  return element['name']=='Subject';
}
function findAuthor(element) {
  return element['name']=='From';
}
function zeroFill( number, width )
{
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}
