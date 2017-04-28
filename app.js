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
app.get('/', (req, res)=>{
	res.send('Hello world, I am a chat bot')
});

// for Facebook verification
app.get('/webhook/', (req, res)=>{
	if (req.query['hub.verify_token'] === 'my_bot_verify') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
});

app.post('/webhook/' (req, res)=>{
	console.log(req)
})

// Spin up the server
app.listen(app.get('port'),()=>{
	console.log('running on port', app.get('port'))
});'use strict';

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
app.get('/', (req, res)=>{
	res.send('Hello world, I am a chat bot')
});

// for Facebook verification
app.get('/webhook/', (req, res)=>{
	if (req.query['hub.verify_token'] === 'my_bot_verify') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
});

app.post('/webhook/' (req, res)=>{
	console.log(req)
})

// Spin up the server
app.listen(app.get('port'),()=>{
	console.log('running on port', app.get('port'))
});


function sendTextMessage({ sender, messageData }) {
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}
