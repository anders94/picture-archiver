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
    const contentRE = new RegExp(/\.(jpg|jpeg|png|gif|heic|mov|mp4)$/, 'i');

    for (const file of files)
	if (contentRE.test(file.name) && file.name.indexOf('-thumbnail.jpg') == -1)
	    content.push([file.path, file.name]);

    console.log(content);

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

const buildIndex = async (dirPath) => {
    let indexes = {};
    const years = await fs.readdirSync(dirPath, {withFileTypes: true});
    for (const year of years) {
	if (year.isDirectory()) {
	    const months = await fs.readdirSync(path.join(year.path, year.name), {withFileTypes: true});
            for (const month of months) {
		if (month.isDirectory()) {
		    const days = await fs.readdirSync(path.join(month.path, month.name), {withFileTypes: true});
		    for (const day of days) {
			if (day.isDirectory()) {
			    if (fs.existsSync(path.join(day.path, day.name), 'index.html')) {
				if (!indexes[year.name])
				    indexes[year.name] = {};
				if (!indexes[year.name][month.name])
				    indexes[year.name][month.name] = {}
				indexes[year.name][month.name][day.name] = day.path;

			    }

			}

		    }

		}

	    }

	}

    }

    const template = fs.readFileSync(templateHTML);

    let html = '<ul class="list-group">\n';
    for (const year of Object.keys(indexes))
	html += `<li class="list-group-item"><a href='./${year}/'>${year}</a></li>\n`;
    html += '</ul>\n';
    fs.writeFileSync(path.join(archiveDirPath, 'index.html'), template.toString().replace('@@content', html));

    for (const year of Object.keys(indexes)) {
	html = '';
	for (const month of Object.keys(indexes[year])) {
	    for (const day of Object.keys(indexes[year][month])) {
		html += `<li class="list-group-item"><a href='./${month}/${day}/'>${year} - ${month} - ${day}</a></li>\n`;

		console.log(year, month, day);

	    }

	}
	html += '</ul>\n';
	fs.writeFileSync(path.join(archiveDirPath, year, 'index.html'), template.toString().replace('@@content', html));

    }

};

(async () => {
    console.log('building content');
    await recurseForContent(archiveDirPath);
    console.log('building indexes');
    await buildIndex(archiveDirPath);

})();
