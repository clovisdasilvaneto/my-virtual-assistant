const Koa = require('koa');
const app = new Koa();
const port = 5000 || process.env.PORT;

let router = require('koa-router')();

// Index route
router.get('/', function *() {
	yield render('Hello World!');
});

// for Facebook verification
router.get('/webhook/', function *() {
	console.log('recebemos uma notificação do facebook')
	console.log(this)
	console.log(this.hub);
});

app.listen(port, ()=> {
	console.log(`server starting on port ${port}`);
});