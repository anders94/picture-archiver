const fs = require('fs');
const path = require('path');

const archiveDirPath = './archive/';
const templateHTML = 'template.html';

const processDirectory = async (dirPath) => {
    const files = await fs.readdirSync(dirPath, {withFileTypes: true});

    for (const file of files) {
	if (file.isDirectory())
	    await processDirectory(path.join(dirPath, file.name));
	else
	    console.log('skipping', path.join(file.path, file.name));

    }

};

const buildHTML = async (dirPath) => {
    const files = await fs.readdirSync(dirPath, {withFileTypes: true});

    const content = [];
    const contentRE = new RegExp(/(jpg|jpeg|png|gif)$/, 'i');

    for (const file of files) {
	if (!file.isDirectory() && contentRE.test(file.name) && file.name.indexOf('-thumbnail.jpg') == -1) {
	    console.log('working on', file.path, file.name);
	    content.push([file.path, file.name]);

	}

    }

    if (content.length > 0) {
	console.log('Building HTML for', dirPath);

	const template = fs.readFileSync(templateHTML);
	let html = '';
	for (const entry of content) {
	    const thumb = entry[1].split('.')[0] + '-thumbnail.jpg';
	    html += `<a href='${entry[1]}'><img src='${thumb}' width=128 height=128 class='rounded'></a>\n`;

	}
	console.log('creating', path.join(dirPath, 'index.html'));
	fs.writeFileSync(path.join(dirPath, 'index.html'), template.toString().replace('@@content', html));

    }

};

(async () => {
    await processDirectory(archiveDirPath);

})();
