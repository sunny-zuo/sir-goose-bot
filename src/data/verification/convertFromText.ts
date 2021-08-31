import fs from 'fs';

const conversionPath = process.argv[2];
const conversionType = process.argv[3] ?? 'file';

function execute() {
    if (!conversionPath) {
        console.log('Usage: (conversion path) (file|directory)');
        return;
    }

    if (conversionType === 'file') {
        processFile(conversionPath);
    } else if (conversionType === 'directory') {
        const files = fs.readdirSync(conversionPath);
        for (const file of files) {
            processFile(`${conversionPath}/${file}`);
        }
    } else {
        console.log('Invalid conversion type provided. Conversion type must be either "file" or "directory"');
    }
}

function processFile(filePath: string) {
    if (filePath) {
        const file = fs.readFileSync(filePath, 'utf8');
        const lines = file
            .split('\n')
            .filter((line) => line.length > 0)
            .map((line) => line.replace('@uwaterloo.ca', '').trim());

        const output = {
            type: 'hash | uwid',
            department: 'department',
            entranceYear: 'entranceYear',
            ids: lines,
        };

        fs.writeFileSync(`${filePath.split('.')[0]}.json`, JSON.stringify(output, null, 4));
        console.log(`File was converted and is located at ${filePath.split('.')[0]}.json`);
    } else {
        console.log('No file to convert was provided.');
    }
}

execute();
