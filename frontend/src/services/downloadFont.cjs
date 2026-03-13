const fs = require('fs');
const https = require('https');

const fontUrl = 'https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf';
const outputPath = 'Roboto-Regular.ttf';

https.get(fontUrl, (response) => {
    const file = fs.createWriteStream(outputPath);
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        const data = fs.readFileSync(outputPath);
        const base64 = data.toString('base64');
        fs.writeFileSync('Roboto-Regular-normal.js', 'export const robotoBase64 = "' + base64 + '";');
        console.log('Font downloaded and converted to Base64.');
    });
}).on('error', (err) => {
    console.error('Error downloading font:', err.message);
});
