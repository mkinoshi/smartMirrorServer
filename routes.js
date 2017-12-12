// import { valid } from '../../../Library/Caches/typescript/2.6/node_modules/@types/joi';

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
var rss_API = "cfa213fae8474a5f9af9a436ad71c1a5"
// Serve this path with the Express static file middleware.
// var app = express();
// app.use(express.static(publicPath));
var fs = require('fs');



mongoose.Promise = global.Promise;
var TOKEN_DIR = path.resolve(__dirname) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail_token.json';
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/calendar.readonly'];
var axios = require('axios');

router.get('/', function(req, res) {
  var ind = 0;
  try {
    ind = 1;
    var data = fs.readFileSync('alarm.txt', 'utf8');
    var array = data.match(/[^\s]+/g);
    var data = array[0].split(':')
    var h = data[0]
    var m = data[1]
  } catch(e) {
    ind = 0 
    // console.log('Error:', e.stack); //Make it not start with an error message
  }
  weather.find({search: 'Waterville, ME', degreeType: 'F'}, function(err, result) {
    if (err && ind === 0) {
      var weather = {
        low: '?',
        high: '?',
        text: '?',
      }
      h = -1;
      m = -1;
    } else if (err) {
      var weather = {
        low: '?',
        high: '?',
        text: '?',
      }
    } else if (ind === 0) {
      h = -1;
      m = -1;
    } else {
      console.log(result[0].forecast)
      var weather = {
        low: result[0].forecast[0].low,
        high: result[0].forecast[0].high,
        text: result[0].forecast[0].skytextday
      }
      console.log(weather)
    }
    res.render('initial', {weather: weather, hour: h, minute: m})
  });
})

router.get('/email', function(req, res) {
  try {
      var data = fs.readFileSync('jerry.txt', 'utf8');
      var array = data.match(/[^\s]+/g);

  } catch(e) {
      console.log('Error:', e.stack); //Make it not start with an error message
  }
  var clientSecret = array[0];
  var clientId =  array[1];
  var redirectUrl =  array[2];
  var rssSource =  array[3];
  var alarmTime = array[4];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  fs.readFile(TOKEN_PATH, function(err, token) {
    //console.log(res)
    if (err) {
      getNewToken(oauth2Client, listLabels, res);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      listLabels(oauth2Client, res, rssSource);
      // listEvents(oauth2Client)
    }
  })
})

function getNewToken(oauth2Client, callback, res) {
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

function storeToken(token) {
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

function listLabels(auth, res, rssSource) {
  //Need to remove my old (bad) time code in favor of makoto's good time code!
  var messages_snippet = [];
  var weatherResult = {};
  var messagesInfo;
  var eventInfo;
  var weatherInfo;
  var newsInfo;
  getAllMessages(auth)
  .catch((err) => {
  })
  .then((returnedMessages) => {
    console.log('it should be here')
    messagesInfo = returnedMessages ? returnedMessages : [];
    return getEvents(auth)
  })
  .catch((err) => {
  })
  .then((returnedCalender) => {
    eventInfo = returnedCalender ? returnedCalender : [];
    return getWeather()
  })
  .catch((err) => {
  })
  .then((returnedWeatherInfo) => {
    weatherInfo = returnedWeatherInfo ? returnedWeatherInfo : {}
    return getNews(rssSource)
  })
  .catch((err) => {
  })
  .then((returnedNews) => {
    newsInfo = returnedNews ? returnedNews : [];
    res.render('email', {message: messagesInfo, weather: weather, articles: newsInfo})
  })
}

// get all of the messages
function getAllMessages (auth) {
  var gmail = google.gmail('v1');
  return new Promise((resolve, reject) => {
    getMessagesList(auth, gmail)
    .then((messages) => {
      var promises = [];
      messages.forEach((mes) => {
        promises.push(getEachMessage(auth, mes.id))
      })
      return Promise.all(promises)
    })
    .then((messages) => {
      console.log('it is here ')
      console.log(messages)
      resolve(messages)
    })
    .catch((err) => {
      console.log(err)
      reject(new Error("mail"));
    })
  })
}
// return the list of messages
function getMessagesList (auth, gmail) {
  return new Promise((resolve, reject) => {
    gmail.users.messages.list({
      auth: auth,
      userId: 'me',
      maxResults: 10,
      q:'is:unread',
    }, function(err, response) {
      if (err) {
        throw new Error("mail");
      } else {
        resolve(response.messages)
      }
    })
  })
}

// return weather information
function getWeather() {
  return new Promise(function(resolve, reject) {
    weather.fin({search: 'Waterville, ME', degreeType: 'F'}, function(err, result) {
      if(err) {
        console.log(err)
        reject(new Error("weather"));
      } else {
        const weatherInfo = {
          low: result[0].forecast[0].low,
          high: result[0].forecast[0].high,
          text: result[0].forecast[0].skytextday
        }
        resolve(weatherInfo)
      }
    })
  })
}

// return news headline
function getNews(rssSource) {
  return new Promise((resolve, reject) => {
    axios.get('https://newsapi.org/v2/top-headlines?sources=' + rssSource + '&apiKey=' + rss_API)
    .then((results) => {
      var articles = results.data.articles.map((data) => [data.title, data.url])
      resolve(articles)
    })
    .catch((err) => {
      console.log(err)
      reject(new Error("news"));
    })
  })
}

function getEachMessage(auth, messageId) {
  var gmail = google.gmail('v1');
  return new Promise(function(resolve, reject) {
    gmail.users.messages.get({
      auth: auth,
      'userId': 'me',
      'id': messageId,
      'format': 'metadata'
    }, function(err, response) {
      if (err) {
        throw new Error("mail");
      }
      //console.log(response.payload.headers)
      // messages.push([response.payload.headers.find(findHeader)["value"],response.snippet,response.payload.headers.find(findAuthor)["value"]]);
      resolve([response.payload.headers.find(findHeader)["value"],response.snippet,response.payload.headers.find(findAuthor)["value"]]);
    })
  })
}

function getEvents(auth) {
  return new Promise((resolve, reject) => {
    var calendar = google.calendar('v3');
    calendar.events.list({
      auth: auth,
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        reject(new Error('calender'))
      } else {
        console.log('Upcoming 10 events:');
        result = [];
        for (var i = 0; i < events.length; i++) {
          var event = events[i];
          var start = event.start.dateTime || event.start.date;
          console.log('%s - %s', start, event.summary);
          result.push([start, event.summary])
        }
        console.log(result);
        resolve(result)
      }
    });
  })
}
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



module.exports = router;