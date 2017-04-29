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
		console.log(data);
		data.entry.forEach(formatEntry);
		res.sendStatus(200);
	}else {
		res.status(401).send('Error, wrong message');
	}
});

// Spin up the server
app.listen(app.get('port'),()=>{
	console.log('running on port', app.get('port'))
});

//chama o setup do bot
setupBotLayout();


//Formata as entradas do usuário
function formatEntry(entry){
	let pageID = entry.id;
	let timerOfEvent = entry.time;
	
	if(entry.messaging){
		entry.messaging.forEach(formatEntryMessage);
	}
}

function formatEntryMessage(event){
	console.log(`Evento: ${event}`)
	
	
	if(event.message){
		console.log(`Mensagem:`);
		console.log(event.message);
		
		return checkMessageToReply(event);
	}else if(event.postback){
		console.log(`Postback:`);
		console.log(event.postback)
		
		return checkPostBackToReply(event);
	}
}

function checkMessageToReply({message, sender}){
	// switch (message.text) {
	//
	//
	// }
}

function checkPostBackToReply({postback, sender}){
	switch (postback.payload){
		case "USER_DEFINED_PAYLOAD":
			sendMessage(sender, {
				"attachment":{
					type:"template",
					payload:{
						template_type:"button",
						text:'Olá amigo, eu sou o seu mais novo Assistente Virtual e estou aqui para lhe auxiliar nos pagamentos da sua conta! \n Informe novas contas teclando: "Nova conta", em seguida pedirei mais informações e uma semana antes do vencimento da sua conta ficarei lhe lembrando de pagar a mesma.',
						buttons:[
							{
								type:"postback",
								title:"Nova Conta",
								payload:"USER_DEFINED_NEW_ACCOUNT"
							},
							{
								type: "element_share",
								share_contents: {
									attachment: {
										type: "template",
										payload: {
											template_type: "generic",
											elements: [
												{
													title: "Assistente virtual para lembrar de pagar as contas!",
													subtitle: "Conheça o assistente virtual que nunca mais irá deixar lhe esquecer de pagar as contas.",
													image_url: "https://scontent.frec8-1.fna.fbcdn.net/v/t31.0-8/16299841_1094347327359465_8166142319977006716_o.jpg",
													default_action: {
														type: "web_url",
														url: "https://www.messenger.com/t/283302338678723/"
													},
													buttons: [
														{
															type: "web_url",
															url: "https://www.messenger.com/t/283302338678723/",
															title: "Experimente!"
														}
													]
												}
											]
										}
									}
								}
							}
						]
					}
				}
			});
			break
		
		case "DEVELOPER_DEFINED_PAYLOAD_FOR_HELP":
			sendMessage(sender, {
				text: `Olá estou em desenvolvimento, mas logo-logo irei te ajudar 🐵🐵`
			});
			break
		
		case "DEVELOPER_DEFINED_PAYLOAD_FOR_START_ORDER":
			//carrosel com as imagens
			let data = {
				attachment: {
					type: "template",
						payload: {
						template_type: "generic",
							elements: [
							{
								title: "Clóvis Neto da Sky",
								image_url: "https://scontent.frec8-1.fna.fbcdn.net/v/t31.0-8/16299841_1094347327359465_8166142319977006716_o.jpg?oh=6b0795577b5968bc676ab27b0c87e887&oe=5976BE64",
								subtitle: "Tem que pagar a sky danado, valor é de R$: 300,00.",
								default_action: {
									type: "web_url",
									url: "https://clovisdasilvaneto.github.io",
									messenger_extensions: true,
									webview_height_ratio: "tall",
									fallback_url: "https://www.google.com"
								},
								buttons: [
									{
										type: "web_url",
										url: "https://clovisdasilvaneto.github.io",
										title: "Ver site"
									}, {
										type: "postback",
										title: "Conversar via chat",
										payload: "DEVELOPER_DEFINED_PAYLOAD"
									}
								]
							},
							{
								title: "Clóvis Neto da Sky",
								image_url: "https://scontent.frec8-1.fna.fbcdn.net/v/t31.0-8/16299841_1094347327359465_8166142319977006716_o.jpg?oh=6b0795577b5968bc676ab27b0c87e887&oe=5976BE64",
								subtitle: "Tem que pagar a sky danado, valor é de R$: 300,00.",
								default_action: {
									type: "web_url",
									url: "https://clovisdasilvaneto.github.io",
									messenger_extensions: true,
									webview_height_ratio: "tall",
									fallback_url: "https://www.google.com"
								},
								buttons: [
									{
										type: "web_url",
										url: "https://clovisdasilvaneto.github.io",
										title: "Ver site"
									}, {
										type: "postback",
										title: "Conversar via chat",
										payload: "DEVELOPER_DEFINED_PAYLOAD"
									}
								]
							}
						]
					}
				}
			};
			
			sendMessage(sender, data, function(){
				sendMessage(sender, {
					text: `As contas acima ainda não foram pagas.`
				});
			});
			
			break;
	}
}

function sendMessage(sender, messageData, callback) {
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id: sender.id},
			message: messageData,
		}
	}, function(error, response) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
		
		if(callback){
			return callback();
		}
	})
}

function setupBotLayout(){
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
	}, sendLogError);
	
	request({
		url: 'https://graph.facebook.com/v2.6/me/thread_settings',
		qs: {access_token:token},
		method: 'POST',
		json: {
			setting_type : "domain_whitelisting",
			whitelisted_domains : ["https://clovisdasilvaneto.github.io","https://www.facebook.com/ClovisDaSilvaNeto",
									"http://google.com", "https://www.messenger.com/t/283302338678723/"],
			domain_action_type: "add"
		}
	}, function(){
		request({
			url: 'https://graph.facebook.com/v2.6/me/thread_settings',
			qs: {access_token:token},
			method: 'POST',
			json: {
				setting_type:"call_to_actions",
				thread_state:"existing_thread",
				call_to_actions:[
					{
						type:"postback",
						title:"❓ - Ajuda",
						payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_HELP"
					},
					{
						type:"postback",
						title:"🔍 - Visualizar contas",
						payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_START_ORDER"
					},
					{
						type:"web_url",
						title:"🌎 - Site do autor",
						url:"https://clovisdasilvaneto.github.io",
						webview_height_ratio: "full",
						messenger_extensions: true
					},
					{
						type:"web_url",
						title:"👤 - Perfil",
						url:"https://www.facebook.com/ClovisDaSilvaNeto"
					}
				]
			}
		}, sendLogError);
	})
}

function sendLogError(error, response) {
	if (error) {
		console.log('Error sending messages: ', error)
	} else if (response.body.error) {
		console.log('Error: ', response.body.error)
	}
}