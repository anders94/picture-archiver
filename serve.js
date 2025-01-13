const http = require('http');
const express = require('express');
const datefns = require('date-fns');
const git = require('isomorphic-git');
const fs = require('fs');

const app = express();
const port = process.env.PORT ? process.env.PORT : 3000;
const host = process.env.HOST ? process.env.HOST : '0.0.0.0';

let archiveDirPath = './archive/';

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

    app.get('/', async (req, res, next) => {
	const paths = await fs.readdirSync(archiveDirPath, {withFileTypes: true});
	const dirs = [];
	const files = [];

	for (const path of paths) {
            if (path.isDirectory())
		dirs.push(path);
	    else
		files.push(path);

	}

	res.render('index', {dirs: dirs, files: files});
	next();

    });

    app.get('/:year', async (req, res, next) => {
	const { year } = req.params;
	const files = await fs.readdirSync(archiveDirPath + year, {withFileTypes: true});
	const dirs = [];

	for (const file of files) {
            if (file.isDirectory())
		dirs.push(file);

	}

	res.render('index', {dirs: dirs});
	next();

    });

    app.get('/:year/:month', async (req, res, next) => {
	const { year, month } = req.params;
	const files = await fs.readdirSync(archiveDirPath + year + '/' + month, {withFileTypes: true});
	const dirs = [];

	for (const file of files) {
            if (file.isDirectory())
		dirs.push(file);

	}

	res.render('index', {dirs: dirs});
	next();

    });

    app.get('/:year/:month/:day', async (req, res, next) => {
	const { year, month, day } = req.params;
	const paths = await fs.readdirSync(archiveDirPath + year + '/' + month + '/' + day, {withFileTypes: true});
	const dirs = [];
	const files = [];

	for (const path of paths) {
	    if (path.isDirectory())
		dirs.push(path.name);
	    else if (path.name.endsWith('-thumbnail.jpg'))
		files.push(path.name);

	}

	res.render('paths', {dirs: dirs, files: files});
	next();

    });

    httpServer.listen(port, host, () => {
	console.log(`Listening on ${host}:${port}`)

    });

})();
