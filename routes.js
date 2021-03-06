"use strict";

// importing necessary packages and define global variables
var express = require('express');
var router = express.Router();
var axios = require('axios');
var weather = require('weather-js');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var path = require("path");
const Entities = require('html-entities').AllHtmlEntities; //For decoding html entities
const entities = new Entities();
var publicPath = path.resolve(__dirname, 'public');
var rss_API = "cfa213fae8474a5f9af9a436ad71c1a5"
var fs = require('fs');
var TOKEN_DIR = path.resolve(__dirname) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail_token.json';
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/calendar.readonly'];


// This is the code before refactoring
// router.get('/', function(req, res) {
//   var ind = 0;
//   try {
//     ind = 1;
//     var data = fs.readFileSync('alarm.txt', 'utf8');
//     var array = data.match(/[^\s]+/g);
//     var data = array[0].split(':')
//     var h = data[0]
//     var m = data[1]
//   } catch(e) {
//     ind = 0
//     // console.log('Error:', e.stack); //Make it not start with an error message
//   }
//   weather.find({search: 'Waterville, ME', degreeType: 'F'}, function(err, result) {
//     if (err && ind === 0) {
//       var weather = {
//         low: '?',
//         high: '?',
//         text: '?',
//       }
//       h = -1;
//       m = -1;
//     } else if (err) {
//       var weather = {
//         low: '?',
//         high: '?',
//         text: '?',
//       }
//     } else if (ind === 0) {
//       h = -1;
//       m = -1;
//     } else {
//       console.log(result[0].forecast)
//       var weather = {
//         low: result[0].forecast[0].low,
//         high: result[0].forecast[0].high,
//         text: result[0].forecast[0].skytextday
//       }
//       console.log(weather)
//     }
//     res.render('initial', {weather: weather, hour: h, minute: m})
//   });
// })

router.get('/', function(req, res) {
  var returnedAlarmInfo = getAlarmInfo();
  var curDate = getTime();
  getWeather()
  .catch((err) => {  // if there is an error, it goes here
  })
  .then((returnedWeatherInfo) => { // if not, wait the above function to finish and run this part
    var errorWeather = {
      low: '?',
      high: '?',
      text: '?',
    }
    var weatherInfo = returnedWeatherInfo ? returnedWeatherInfo : errorWeather;
    res.render('initial', {date: curDate, weather: weatherInfo, hour: returnedAlarmInfo[0], minute: returnedAlarmInfo[1]})
  })
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
  //var alarmTime = array[4];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, listLabels, res);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      getPersonalInfo(oauth2Client, res, rssSource);
    }
  })
})

// read a text file called alarm.txt for alarm information
function getAlarmInfo () {
  try {
    var data = fs.readFileSync('alarm.txt', 'utf8');
    var array = data.match(/[^\s]+/g);
    var data = array[0].split(':')
    var h = data[0]
    var m = data[1]
    return [h, m]
  } catch(e) {
    return [-1, -1]
  }
}

// when it is the first time to connect Google API, it gets a new Token
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

// once it gets a new token, it stores tha token as a text file
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

// This is the code before the refactoring
// function getPersonalInfo (auth, res, rssSource) {
//   var gmail = google.gmail('v1');
//   //Need to remove my old (bad) time code in favor of makoto's good time code!
//   var messages_snippet = [];
//   var dt = new Date();
//   var ampm = 'pm';
//   if (dt.getHours() / 12 < 1) {
//     ampm = 'am'
//   }
//   var curTime = ((dt.getHours()) % 12) + ":" + zeroFill(dt.getMinutes(),2) + ' '+ ampm;
//   var curDate = dt.getDate() + "-" + dt.getMonth() + "-" + dt.getFullYear();
//   gmail.users.messages.list({
//     auth: auth,
//     userId: 'me',
//     maxResults: 10,
//     q:'is:unread',
//   }, function(err, response) {
//     if (err) {
//       console.log('The API returned an error: ' + err);
//       return;
//     }
//     var messages = response.messages;
//     if (messages == null) {
//       console.log('No messages found.');
//       res.render('email',{message: '', time:curTime, date: curDate})
//     } else {
//       var promises = [];
//       messages.forEach((mes) => {
//         promises.push(getEachMessage(auth, mes.id, messages_snippet))
//       })
//       Promise.all(promises)
//       .then(() => {
//         console.log('Emails Obtained!')
//         //console.log(messages_snippet);
//         weather.find({search: 'Waterville, ME', degreeType: 'F'}, function(err, result) {
//           if(err) {
//             res.status(400).send({"error": "could not save data"})
//           } else {
//             console.log(result[0].forecast)
//             const weather = {
//               low: result[0].forecast[0].low,
//               high: result[0].forecast[0].high,
//               text: result[0].forecast[0].skytextday
//             }
//             axios.get('https://newsapi.org/v2/top-headlines?sources=' + rssSource + '&apiKey=' + rss_API)
//             .then((results) => {
//               console.log(results.data.articles)
//               var articles = results.data.articles.map((data) => [data.title, data.url])
//               res.render('email', {message: messages_snippet, time:curTime, date: curDate, weather: weather, articles: articles})
//             })
//             .catch((err) => {
//               console.log(err)
//             })
//           }
//         })
//       })
//       .catch((err) => {
//         console.log(err);
//         console.log('Oops')
//       })

//     }
//   });
// }


// get all of the personal information including emails, calendar, and news source preference
function getPersonalInfo(auth, res, rssSource) {
  var messages_snippet = [];
  var weatherResult = {};
  var messagesInfo;
  var eventInfo;
  var weatherInfo;
  var newsInfo;
  getAllMessages(auth)
  .catch((err) => {  // if there is an error, it goes here
  })
  .then((returnedMessages) => { // if not, wait the above function to finish and run this part
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
    var unloadedWeather = {
      low: '?',
      high: '?',
      text: '?',
    };
    weatherInfo = returnedWeatherInfo ? returnedWeatherInfo : unloadedWeather
    return getNews(rssSource)
  })
  .catch((err) => {
  })
  .then((returnedNews) => {
    newsInfo = returnedNews ? returnedNews : [];
    var curDate = getTime()
    res.render('email', {date: curDate, message: messagesInfo, weather: weatherInfo, articles: newsInfo, events: eventInfo, source:rssSource})
  })
}

// get the current time
function getTime() {
  var dt = new Date();
  var curTime = zeroFill(dt.getHours(),2) + ":" + zeroFill(dt.getMinutes(),2) + ":" + zeroFill(dt.getSeconds(),2);
  return (dt.getMonth() + 1) + "/" + dt.getDate() + " - " + curTime;
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

// get weather information and return weather information
function getWeather() {
  return new Promise(function(resolve, reject) {
    weather.find({search: 'Waterville, ME', degreeType: 'F'}, function(err, result) {
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

// Access each message and returns it
function getEachMessage(auth, messageId) {
  var gmail = google.gmail('v1');
  return new Promise(function(resolve, reject) {
    gmail.users.messages.get({
      auth: auth,
      'userId': 'me',
      'id': messageId,
      'format': 'metadata',

    }, function(err, response) {
      if (err) {
        reject(new Error("mail"));
      }
      resolve([snipString(response.payload.headers.find(findHeader)["value"],'title'),snipString(entities.decode(response.snippet),'summary'),response.payload.headers.find(findAuthor)["value"],response.payload.headers.find(findDate)["value"]]);
    })
  })
}

// Get upcoming events
function getEvents(auth) {
  return new Promise((resolve, reject) => {
    var calendar = google.calendar('v3');
    calendar.events.list({
      auth: auth,
      calendarId: 'primary',
      maxResults: 10,
      timeMin: (new Date()).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        reject(new Error('calender'))
      } else {
        var result = [];
        var events = response.items
        for (var i = 0; i < events.length; i++) {
          var event = events[i];
          var start = event.start.dateTime || event.start.date;
          result.push([start, snipString(event.summary, 'title'), snipString(event.location, 'title')])        }
        resolve(result)
      }
    });
  })
}
//The code below looks unclean, but because of how the find function works in javascript, we cannot have two parameters, and hence need 3 different functions
//This specific function is for finding a special object from a list of objects with the name 'Subject'
function findHeader(element) {
  return element['name']=='Subject';
}

//This specific function is for finding a special object from a list of objects with the name 'Date'
function findDate(element) {
  return element['name']=='Date';
}

//This specific function is for finding a special object from a list of objects with the name 'From'
function findAuthor(element) {
  return element['name']=='From';
}

//This function add a leading number of zeros up to a certain point
function zeroFill( number, width ) {
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}

/* 2 Not good functions (Need to take null into account, and could pull both of these methods together into one, like below)
function snipTitle(stringToSnip) {
  if(stringToSnip.length > 50) {
    return stringToSnip.slice(0,50) + '...';
  }
  else {
    return stringToSnip
  }
}
function snipSummary(stringToSnip) {
  if(stringToSnip.length > 100) {
    return stringToSnip.slice(0,100) + '...';
  }
  else {
    return stringToSnip
  }
}


*/


function snipString(stringToSnip, typeOfString) {
  if(stringToSnip != null) {
    if(stringToSnip.length > 50 && typeOfString =='title') {
      return stringToSnip.slice(0,50) + '...';
    }
    else if(stringToSnip.length > 100 && typeOfString =='summary') {
      return stringToSnip.slice(0,100) + '...';
    }
    else {
      return stringToSnip
    }
  }
}

module.exports = router;
