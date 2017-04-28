const Koa = require('koa');
const app = new Koa();
const port = 3000 || process.env.PORT;

let router = require('koa-router')();

// Index route
router.get('/', function *() {
	yield.render('Hello World!');
});

// for Facebook verification
router.get('/webhook/', function *() {
	console.log('recebemos uma notificação do facebook')
	console.log(this)
	console.log(this.hub);
});

app.listen(3000, ()=> {
	console.log(`server starting on port 3000`);
});