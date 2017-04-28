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
		res.status(200).send(req.query['hub.challenge']);
	}
	res.status(401).send('Error, wrong token');
});

app.post('/webhook/', (req, res)=>{
	let data = req.body;
	
	if(data){
		data.entry.forEach(formatEntry);
	}else {
		res.status(401).send('Error, wrong message');
	}
});

// Spin up the server
app.listen(app.get('port'),()=>{
	console.log('running on port', app.get('port'))
});

function formatEntry(entry){
	let pageID = entry.id;
	let timerOfEvent = entry.time;
	
	entry.message.forEach(formatEntryMessage);
	res.sendStatus(200);
}

function formatEntryMessage(message){
	message.forEach(event=>{
		if(event.message){
			console.log('foi mensagem')
		}
	});
}

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









request({
	url: 'https://graph.facebook.com/v2.6/me/thread_settings',
	qs: {access_token:token},
	method: 'POST',
	json: {
		setting_type:"call_to_actions",
		thread_state:"new_thread",
		call_to_actions:[
			{
				payload:"USER_DEFINED_PAYLOAD"
			}
		]
	}
}, function(error, response) {
	if (error) {
		console.log('Error sending messages: ', error)
	} else if (response.body.error) {
		console.log('Error: ', response.body.error)
	}
});