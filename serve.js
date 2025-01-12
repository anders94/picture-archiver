const http = require('http');
const express = require('express');
const datefns = require('date-fns');
const git = require('isomorphic-git');
const fs = require('fs');

const app = express();
const port = process.env.PORT ? process.env.PORT : 3000;
const host = process.env.HOST ? process.env.HOST : '0.0.0.0';

(async () => {
    const commit = process.env.GIT_COMMIT ? process.env.GIT_COMMIT : await git.log({fs, dir: '.', depth: 1, ref: 'main'});

    app.set('view engine', 'pug');
    app.set('trust proxy', true);
    app.use(express.static('public'));

    const httpServer = http.createServer(app);

    app.use((req, res, next) => {
	res.locals.datefns = datefns;
	res.locals.formatter = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
	res.locals.commit = commit[0].oid;
	console.log(req.ip, req.method, req.url);
	next();

    });

    app.get('/', function(req, res, next) {
	res.render('index');
	next();

    });

    app.get('/:page', function(req, res, next) {
	res.render(req.params.page, {page: req.params.page});
	next();

    });

    httpServer.listen(port, host, () => {
	console.log(`Listening on ${host}:${port}`)

    });

})();
