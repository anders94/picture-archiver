const fs = require('fs');
const path = require('path');

const archiveDirPath = './archive/';
const templateHTML = 'template.html';

const recurseForContent = async (dirPath) => {
    const files = await fs.readdirSync(dirPath, {withFileTypes: true});

    let foundThumbnail = false;

    for (const file of files) {
	if (file.isDirectory())
	    await recurseForContent(path.join(dirPath, file.name));
	else
	    if (file.name.indexOf('-thumbnail.jpg') > -1)
		foundThumbnail = true;

    }

    if (foundThumbnail)
	await buildContent(dirPath);

};

const buildContent = async (dirPath) => {
    console.log(' --', dirPath);
    const files = await fs.readdirSync(dirPath, {withFileTypes: true});

    const content = [];

    for (const file of files)
	if (file.name.indexOf('-thumbnail.jpg') > -1)
	    content.push([file.path, file.name]);

    if (content.length > 0) {
	const template = fs.readFileSync(templateHTML);
	let html = '';
	for (const entry of content) {
	    const thumb = entry[1].split('.')[0] + '-thumbnail.jpg';
	    html += `<a href='${entry[1]}'><img src='${thumb}' width=128 height=128 class='rounded'></a>\n`;

	}
	fs.writeFileSync(path.join(dirPath, 'index.html'), template.toString().replace('@@content', html));

    }
    else
	console.log('didnt make an index for', dirPath, 'because i didnt see thumbnails');

};

const recurseForIndex = async (dirPath) => {
    const files = await fs.readdirSync(dirPath, {withFileTypes: true});

    let foundHTML = false;

    for (const file of files) {
	if (file.isDirectory())
	    recurseForIndex(path.join(dirPath, file.name));
	else
	    if (file.name == 'index.html')
		foundHTML = true;

    }

    if (foundHTML)
	await buildIndex(dirPath);

};

const buildIndex = async (dirPath) => {
    console.log(' --', dirPath);
    const files = await fs.readdirSync(dirPath, {withFileTypes: true});

    const indexes = [];

    for (const file of files)
	if (file.name.indexOf('-thumbnail.jpg') > -1)
	    indexes.push([file.path, file.name]);

    if (indexes.length > 0) {
	const template = fs.readFileSync(templateHTML);
	let html = '';
	for (const entry of indexes)
	    html += `<a href='${entry[1]}'>${entry[0]}/${entry[1]}</a>\n`;

	fs.writeFileSync(path.join(dirPath, 'index.html'), template.toString().replace('@@content', html));

    }
    else
	console.log('didnt make an index for', dirPath, 'because i didnt see indexes');

};

(async () => {
    console.log('building content');
    await recurseForContent(archiveDirPath);
    console.log('building indexes');
    await recurseForIndex(archiveDirPath);

})();
