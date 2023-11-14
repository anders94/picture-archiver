const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const convert = require('heic-convert');
const extractFrame = require('ffmpeg-extract-frame')

const archiveDirPath = './archive/';
const thumbnailWidth = 256;
const thumbnailHeight = 256;
const watermarkPath = 'movie-watermark.png';

const processDirectory = async (dirPath) => {
    const files = await fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
	if (file.isDirectory())
	    await processDirectory(path.join(dirPath, file.name));
	else
	    await processFile(dirPath, file.name);

    }

};

const processFile = async (dirPath, fileName) => {
    const filePath = path.join(dirPath, fileName);
    const stats = fs.statSync(filePath);

    const creationDate = stats.birthtime;
    const year = creationDate.getFullYear().toString();
    const month = (creationDate.getMonth() + 1).toString().padStart(2, '0');
    const day = creationDate.getDate().toString().padStart(2, '0');
    const hour = creationDate.getHours().toString().padStart(2, '0');
    const minute = creationDate.getMinutes().toString().padStart(2, '0');
    const second = creationDate.getSeconds().toString().padStart(2, '0');

    const prefix = year + '-' + month + '-' + day + '_' + hour + '-' + minute + '-' + second + '_';

    const newFilePath = path.join(archiveDirPath, `${year}/${month}/${day}`);

    console.log(path.join(newFilePath, prefix + fileName));

    if (!fs.existsSync(archiveDirPath))
	fs.mkdirSync(archiveDirPath);

    if (!fs.existsSync(path.join(archiveDirPath, year)))
	fs.mkdirSync(path.join(archiveDirPath, year));

    if (!fs.existsSync(path.join(archiveDirPath, year, month)))
	fs.mkdirSync(path.join(archiveDirPath, year, month));

    if (!fs.existsSync(path.join(archiveDirPath, year, month, day)))
	fs.mkdirSync(path.join(archiveDirPath, year, month, day));

    try {
	fs.copyFileSync(filePath, path.join(newFilePath, prefix + fileName));
    }
    catch (err) {
	console.error('Error copying file:', err);
    }

    const thumbnailFileName = path.join(newFilePath, prefix + fileName.split('.')[0] + '-thumbnail.jpg');

    const imageRE = new RegExp(/\.(jpg|jpeg|png|gif)$/, 'i');
    const heicRE =  new RegExp(/\.(heic)$/, 'i');
    const movieRE = new RegExp(/\.(mov|mp4)$/, 'i');

    if (imageRE.test(fileName)) {
	await sharp(path.join(newFilePath, prefix + fileName)).resize(thumbnailWidth, thumbnailHeight).toFile(thumbnailFileName).catch((err) => {
	    console.error('Error creating thumbnail:', err);
	});

    }
    else if (heicRE.test(fileName)) {
	const inputBuffer = fs.readFileSync(path.join(newFilePath, prefix + fileName));
	const outputBuffer = await convert({buffer: inputBuffer, format: 'JPEG', quality: 1});

	await fs.writeFileSync('./tmp.jpg', outputBuffer);

	await sharp('./tmp.jpg').resize(thumbnailWidth, thumbnailHeight).toFile(thumbnailFileName).catch((err) => {
	    console.error('Error creating thumbnail:', err);
	});

    }
    else if (movieRE.test(fileName)) {
	await extractFrame({
	    input: path.join(newFilePath, prefix + fileName),
	    output: './tmp.jpg',
	    offset: 500
	});

	await sharp('./tmp.jpg').resize(thumbnailWidth, thumbnailHeight).composite([{input: watermarkPath}]).toFile(thumbnailFileName).catch((err) => {
	    console.error('Error creating thumbnail:', err);
	});

    }

};

const buildHTML = async (dirPath) => {
    const files = await fs.readdirSync(dirPath, {withFileTypes: true});

    for (const file of files) {
	if (file.isDirectory())
	    await buildHTML(path.join(dirPath, file.name));

    }

    const content = [];
    const contentRE = new RegExp(/\.(jpg|jpeg|png|gif|heic)$/, 'i');

    for (const file of files) {
	if (!file.isDirectory() && contentRE.test(file.name) && file.name.indexOf('-thumbnail.jpg') == -1) {
	    console.log('working on', file.path, file.name);
	    content.push(file.name);

	}

    }

    if (content.length > 0) {
	console.log('Building HTML for', dirPath);
	console.log(content);

    }

};

(async () => {
    if (! process.argv[2]) {
	console.error('Please provide a directory path as an argument');
	return 1;

    }

    await processDirectory(process.argv[2]);

    await buildHTML(archiveDirPath);

})();
