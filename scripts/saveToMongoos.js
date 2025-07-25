const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('gitAnalytics');
    const collection = db.collection('commits');

    const metricsDir = path.join(__dirname, '../metrics');
    const files = fs.readdirSync(metricsDir).filter(file => file.endsWith('.json'));

    if (files.length === 0) {
      console.warn('⚠️ No JSON files found in /metrics');
      return;
    }

    const defaultFile = files[0]; // Pick the first JSON file
    const dataPath = path.join(metricsDir, defaultFile);
    const commitData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    if (!Array.isArray(commitData)) {
      console.warn(`⚠️ The file ${defaultFile} does not contain an array.`);
      return;
    }

    await collection.insertMany(commitData);
    console.log(`✅ Data inserted from ${defaultFile} into MongoDB`);
  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    await client.close();
  }
}

run();
