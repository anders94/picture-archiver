const http = require('http');
const express = require('express');
const datefns = require('date-fns');
const git = require('isomorphic-git');
const fs = require('fs');

const app = express();
const port = process.env.PORT ? process.env.PORT : 3000;
const host = process.env.HOST ? process.env.HOST : '0.0.0.0';

let archiveDirPath = 'archive/';

const handle = async (req, res, next) => {
    const { a, b, c, d, e, f, g } = req.params;

    try {
	const paths = await fs.readdirSync(archiveDirPath + [a, b, c, d, e, f, g].filter(Boolean).join('/'), {withFileTypes: true});
	const dirs = [];
	const files = [];

	for (const path of paths) {
	    if (path.isDirectory())
		dirs.push(path);
	    else if (path.name.endsWith('-thumbnail.jpg')) {
		const file = {thumbnail: path, path: path.path};
		const base = path.name.replace(/-thumbnail.jpg$/, '');
		// jpg|jpeg|png|gif|heic|mov|mp4
		if (paths.some(item => item.name === base + '.jpeg')) {
		    file.name = base + '.jpeg';
		    files.push(file);

		}
		else if (paths.some(item => item.name === base + '.jpg')) {
		    file.name = base + '.jpg';
		    files.push(file);

		}
		else if (paths.some(item => item.name === base + '.png')) {
		    file.name = base + '.png';
		    files.push(file);

		}
		else if (paths.some(item => item.name === base + '.heic')) {
		    file.name = base + '.heic';
		    files.push(file);

		}
		else if (paths.some(item => item.name === base + '.mp4')) {
		    file.name = base + '.mp4';
		    files.push(file);

		}
		else if (paths.some(item => item.name === base + '.mov')) {
		    file.name = base + '.mov';
		    files.push(file);

		}
		else
		    console.log('original not found', base);

	    }

	}

	res.render('index', {
	    path: [a, b, c, d, e, f, g].filter(Boolean).join('/'),
	    dirs: dirs, files: files
	});
	    
    }
    catch (e) {
	console.log(e);
	res.render('error', {message: 'Whoops, that\'s an error!'});

    }
    finally {
	next();

    }

}

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

    app.get('/', handle);
    app.get('/:a/', handle);
    app.get('/:a/:b/', handle);
    app.get('/:a/:b/:c/', handle);
    app.get('/:a/:b/:c/:d/', handle);
    app.get('/:a/:b/:c/:d/:e', handle);
    app.get('/:a/:b/:c/:d/:e/:f', handle);
    app.get('/:a/:b/:c/:d/:e/:f/:g', handle);

    httpServer.listen(port, host, () => {
	console.log(`Listening on ${host}:${port}`)

    });

})();
