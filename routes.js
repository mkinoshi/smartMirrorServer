"use strict";

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var axios = require('axios');
var alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
var _ = require('underscore');
var weather = require('weather-js');
mongoose.Promise = global.Promise;

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

module.exports = router;
