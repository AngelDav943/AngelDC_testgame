const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');

const cookies = require(`${__dirname}/server-modules/cookies.js`);
const accounts = require(`${__dirname}/server-modules/accounts.js`);

app.use(cors())
app.use('/assets', express.static('assets/public'));

app.get('/login', (req, res) => {
	var name = req.query.n;
	var pass = req.query.p;

	if (!name && !pass) res.sendFile(`${__dirname}/assets/public/pages/login.html`)

	if(name && pass) {
		console.log("login process stdarted, name " + name);
		accounts.loginUser(req, name, pass).then(login => {
			accounts.getUserByUID(login.split(";")[0].split("=")[1]).then(user => {
				res.send(`<script>document.cookie = "${login}"; window.location = "https://testgame.angeldc943.repl.co/game";</script>`)
			})
		})
	}
});

app.get('/the', (req, res) => {
	res.sendFile(`${__dirname}/assets/public/pages/the.html`)
});

app.get('/game', (req, res) => {
	accounts.verifyuser(cookies.getCookie(req.headers.cookie,"uid")).then(account => {
		res.sendFile(`${__dirname}/assets/public/pages/game.html`)
	})
});

app.get('/*', (req, res) => {
	accounts.verifyuser(cookies.getCookie(req.headers.cookie,"uid")).then(account => {
		res.sendFile(`${__dirname}/assets/public/pages/menu.html`)
	})
});

let players = {}
var last_newpos = {}

io.on('connection', socket => {
    eval(fs.readFileSync(`${__dirname}/events/io:connection.js`).toString())
});

http.listen(3000, () => {
	console.log('server started');
});