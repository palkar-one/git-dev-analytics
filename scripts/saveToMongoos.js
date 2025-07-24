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

    const dataPath = path.join(__dirname, '../metrics/yourRepoName.json');
    const commitData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    await collection.insertMany(commitData);
    console.log('✅ Data inserted into MongoDB');
  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    await client.close();
  }
}

run();
