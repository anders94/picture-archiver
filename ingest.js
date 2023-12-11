const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const convert = require('heic-convert');
const extractFrame = require('ffmpeg-extract-frame')

let archiveDirPath = './archive/';
const thumbnailWidth = 256;
const thumbnailHeight = 256;
const watermarkPath = 'movie-watermark.png';

const acceptableFilesRE = new RegExp(/\.(jpg|jpeg|png|gif|heic|mov|mp4)$/, 'i');

const processDirectory = async (dirPath) => {
    const files = await fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
	if (file.isDirectory())
	    await processDirectory(path.join(dirPath, file.name));
	else {
	    if (acceptableFilesRE.test(file.name))
		await processFile(dirPath, file.name);
	    else
		console.log('skipping', path.join(dirPath, file.name));

	}

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
	if (!fs.existsSync(path.join(newFilePath, prefix + fileName))) {
	    fs.copyFileSync(filePath, path.join(newFilePath, prefix + fileName));
	    fs.chmodSync(path.join(newFilePath, prefix + fileName), '644');

	}

    }
    catch (err) {
	console.error('Error copying file:', err);

    }

    const heicRE = new RegExp(/\.heic$/, 'i');
    const imageRE = new RegExp(/\.(jpg|jpeg|png|gif)$/, 'i');
    const movieRE = new RegExp(/\.(mov|mp4)$/, 'i');

    // if its a HEIC, convert to PNG
    if (heicRE.test(fileName)) {
	const inputBuffer = fs.readFileSync(path.join(newFilePath, prefix + fileName));
	const outputBuffer = await convert({buffer: inputBuffer, format: 'PNG'});

	const heicFileName = fileName;
	fileName = heicFileName.replace(/\.HEIC$/i, '.png');

	fs.writeFileSync(path.join(newFilePath, prefix + fileName), outputBuffer);
	fs.unlinkSync(path.join(newFilePath, prefix + heicFileName));

    }

    const thumbnailFileName = path.join(newFilePath, prefix + fileName.split('.')[0] + '-thumbnail.jpg');

    if (!fs.existsSync(thumbnailFileName)) {
	if (imageRE.test(fileName)) {
	    await sharp(path.join(newFilePath, prefix + fileName))
		.rotate()
		.resize(thumbnailWidth, thumbnailHeight)
		.toFile(thumbnailFileName).catch((err) => {
		console.error('Error creating thumbnail:', err);
	    });

	}
	else if (movieRE.test(fileName)) {
	    await extractFrame({
		input: path.join(newFilePath, prefix + fileName),
		output: './tmp.jpg',
		offset: 500
	    });

	    await sharp('./tmp.jpg')
		.rotate()
		.resize(thumbnailWidth, thumbnailHeight)
		.composite([{input: watermarkPath}])
		.toFile(thumbnailFileName).catch((err) => {
		console.error('Error creating thumbnail:', err);
	    });

	}

    }

};

(async () => {
    if (! process.argv[2]) {
	console.error('Usage: node ingest source/ [destination/]');
	return 1;

    }

    if (process.argv[3])
	if (!fs.existsSync(process.argv[3])) {
	    console.log('Error:', process.argv[3], 'doesn\'t exist!');
	    return 1;
	}
	else
	    archiveDirPath = process.argv[3];

    await processDirectory(process.argv[2]);

})();
