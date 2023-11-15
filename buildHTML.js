const fs = require('fs');
const path = require('path');

const archiveDirPath = 'archive/';
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
	if (file.isDirectory() && await recurseForIndex(path.join(dirPath, file.name)))
	    buildIndex(dirPath);
	else
	    if (file.name == 'index.html')
		foundHTML = true;

    }

    return foundHTML;

};

const buildIndex = async (dirPath) => {
    console.log(' --', dirPath);
    const files = await fs.readdirSync(dirPath, {withFileTypes: true});

    const indexes = [];

    for (const file of files)
	if (file.isDirectory()) {
	    const subFiles = await fs.readdirSync(path.join(dirPath, file.name), {withFileTypes: true});
	    for (const subFile of subFiles)
		if (!subFile.isDirectory() && subFile.name == 'index.html')
		    indexes.push([file.path, file.name]);

	}

    if (indexes.length > 0) {
	const template = fs.readFileSync(templateHTML);
	let html = '<ul  class="list-group">\n';
	for (const entry of indexes) {
	    const sanitizedPath = path.join(entry[0].replace(archiveDirPath, ''), entry[1]);
	    html += `<li class="list-group-item"><a href='${sanitizedPath}'>${sanitizedPath}</a></li>\n`;

	}

	html += '</ul>\n';
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
