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

    // Clear existing data
    await collection.deleteMany({});
    console.log('🗑️ Cleared existing commit data');

    let totalInserted = 0;

    // Process all JSON files
    for (const file of files) {
      const dataPath = path.join(metricsDir, file);
      const commitData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

      if (!Array.isArray(commitData)) {
        console.warn(`⚠️ The file ${file} does not contain an array.`);
        continue;
      }

      // Add repository name to each commit
      const repoName = path.basename(file, '.json');
      const enrichedData = commitData.map(commit => ({
        ...commit,
        repository: repoName,
        date: new Date(commit.date) // Ensure date is properly formatted
      }));

      await collection.insertMany(enrichedData);
      totalInserted += enrichedData.length;
      console.log(`✅ Inserted ${enrichedData.length} commits from ${file}`);
    }

    console.log(`🎉 Total commits inserted: ${totalInserted}`);
  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    await client.close();
  }
}

run();
