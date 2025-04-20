const fs = require('fs');
const path = require('path');

// Import the formatSessions function from script.js
const { formatSessions } = require('./script.js');

// Main script
const filePath = process.argv[2];

if (!filePath) {
    console.error('Usage: node testFormatSessions.js <path-to-json-file>');
    process.exit(1);
}

const absolutePath = path.resolve(filePath);

fs.readFile(absolutePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading file: ${err.message}`);
        process.exit(1);
    }

    try {
        const jsonData = JSON.parse(data);
        const output = formatSessions(jsonData.data);
        console.log(output);
    } catch (err) {
        console.error(`Error parsing JSON: ${err.message}`);
        process.exit(1);
    }
});
