const Koa = require('koa');
const app = new Koa();
const port = 3000 || process.env.PORT;

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_bot_verify') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
});

app.listen(3000, ()=> {
	console.log(`server starting on port 3000`);
});