const fs = require('fs').promises;
const path = require('path');

async function run() {
  const filePath = path.join(__dirname, 'data.txt');

  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf8');
    console.log('File content:', data);
  } catch (err) {
    console.log('File not found, creating...');
    await fs.writeFile(filePath, 'Initial content!');
  }
}

run();
