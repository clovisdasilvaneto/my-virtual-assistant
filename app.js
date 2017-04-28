'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const config = require('./config/config.js');
const app = express();
const token = process.env.FB_PAGE_ACCESS_TOKEN;

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_bot_verify') {
		res.send('Request Accepted')
	}
	res.send('Error, wrong token')
});

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
});