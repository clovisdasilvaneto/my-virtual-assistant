'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const config = require('./config/config.js');
const app = express();
const token = process.env.FB_PAGE_ACCESS_TOKEN;

app.set('port', (process.env.PORT || 5000));
app.set('trust proxy', 1) // trust first proxy

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
	if(event.message){
		console.log(`Mensagem:`);
		console.log(event.message);
		
		return checkMessageToReply(event);
	}else if(event.postback){
		console.log(`Postback:`);
		console.log(event.postback);
		
		return checkPostBackToReply(event);
	}
}

function checkMessageToReply({message, sender}){
	openFile(sender.id, (err, section) => {
		if(!err){
			section = JSON.parse(section);
			
			console.log('Chegou uma mensagem da seção');
			console.log(section);
			
			return checkMessageToSteps(message, sender, section);
		}
		
		if(message.text.match(/^NOVA CONTA$/ig)) {
			return addNewAccount(sender);
		}
	});
}

function checkMessageToSteps(message, sender, section){
	let accountName,
		accountValue,
		account;
	
	switch (section.step){
		//Pergunta o valor da conta e grava o nome da conta na seção
		case 1:
			accountName = section.name = message.text;
			
			sendMessage(sender, {
				text: `Certo estou gravando a conta: ${accountName} nos meus registros, agora me informe qual o valor da sua conta`
			}, function(){
				section.step = 2;
				writeFile(sender.id, section);
			});
			break;
		
		//Pergunta a data de vencimento da conta  e grava o valor da conta na seção
		case 2:
			accountName = section.name;
			accountValue = section.value = message.text;
			
			sendMessage(sender, {
				text: `Certo estou gravando o valor de: ${accountValue}, da conta: ${accountName} nos meus registros, para finalizarmos me informe a data de vencimento da sua conta no formato: dd/mm/yyyy. Ex: 29/02/2030`
			}, function(){
				section.step = 3;
				writeFile(sender.id, section);
			});
			break;
		
		//TODO: Salvar os detalhes da conta no banco, e destruir a seção
		case 3:
			if(message.text.match(/^\d{2}\/\d{2}\/\d{4}$/g)){
				section.issueDate = message.text;
				account = section;
				
				console.log('Nova conta cadastrada: ');
				console.log(account);
				
				sendMessage(sender, {
					text: `
							Conta cadastrada com sucesso, quando estiver na semana da sua conta, irei lhe avisar todos os dias. Segue os detalhes da sua conta:\n\nNome da conta: ${account.name}\nValor: ${account.value}\nData de vencimento: ${account.issueDate}\n\nVocê pode visualizar todas as suas contas em Menu do Chat > 🔍 - Visualizar contas. Caso queira em algum momento cadastrar uma nova conta, é só falar comigo digitando: "Nova Conta". Espero ver você em breve!
						 `
				}, function(){
					deleteFile(sender.id, err => {
						console.log('Seção do usuário finalizada!');
						section.issueDate = formatDate(section.issueDate);
						
						return scheduleAccountDate(section, sender)
					});
				});
			}else {
				sendMessage(sender, {
					text: `Formato de data inválida, informe a data no seguinte formato: dd/mm/yyyy. Ex: 29/02/2030`
				});
			}
			break;
	}
}

function checkPostBackToReply({postback, sender}, req){
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
			break;
		
		case "USER_DEFINED_NEW_ACCOUNT":
			addNewAccount(sender);
			break;
		
		case "DEVELOPER_DEFINED_PAYLOAD_FOR_HELP":
			sendMessage(sender, {
				text: `Olá estou em desenvolvimento, mas logo-logo irei te ajudar 🐵🐵`
			});
			break;
		
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


function addNewAccount(sender){
	let data = {
			step: 1
		},
		src = sender.id;
	
	writeFile(src, data, err=>{
		sendMessage(sender, {
			text: `Informe o nome da conta:`
		});
	})
}

function deleteFile(userId, callback){
	let src = 'chat-user'+userId+'.json';
	
	fs.unlinkSync(src, callback);
}

function openFile(userId, callback){
	let src = 'chat-user'+userId+'.json';
	
	fs.readFile(src, callback);
}

function writeFile(userId, data, callback){
	let src = 'chat-user'+userId+'.json';
	
	data = JSON.stringify(data);
	fs.writeFile(src, data, callback);
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
						title:"Nova Conta",
						payload:"USER_DEFINED_NEW_ACCOUNT"
					},
					{
						type:"postback",
						title:"🔍 - Visualizar contas",
						payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_START_ORDER"
					},
					{
						type:"web_url",
						title:"🌎 - Blog do autor",
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

function formatDate(maskedDate){
	maskedDate = maskedDate.split('/');
	
	return new Date(maskedDate[2], maskedDate[1], maskedDate[0],0,0,0,0);
}

function scheduleAccountDate(account, sender){
	// let issueDate = account.issueDate.setDate(account.issueDate.getDate() - 7);
	let issueDate = account.issueDate.setDate(account.issueDate.getDate());
	let secondBetweenIssueDate = getDatesSeconds(new Date(), issueDate);
	let interval;
	
	console.log(`SCHEDULE: ${secondBetweenIssueDate}`);
	
	setTimeout(function(issueDate, sender, account){
		interval = setInterval(function(){
			sendMessage(sender, {
				text: `Sua conta: ${account.name} - vai vencer no dia: ${account.issueDate}, lembre-se de paga-lá.`
			})
		}, 4000);
		
	}, secondBetweenIssueDate, issueDate, sender, account);
}

function getDatesSeconds(d1, d2){
	let dif = d1.getTime() - d2.getTime();
	
	let Seconds_from_T1_to_T2 = dif / 1000;
	
	
	return Math.abs(Seconds_from_T1_to_T2);
}