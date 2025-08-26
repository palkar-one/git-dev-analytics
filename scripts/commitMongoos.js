const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// MongoDB connection setup
const mongoUri = 'mongodb://localhost:27017'; // 🔁 Change if using cloud Mongo
const dbName = 'gitAnalytics';
const collectionName = 'commits';

const baseRepoPath = path.join(__dirname, '../cloned_repos');

async function connectToMongo() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  console.log('📡 Connected to MongoDB');
  return client.db(dbName).collection(collectionName);
}

async function getCommitMetrics(repoDir, collection) {
  const repoPath = path.join(baseRepoPath, repoDir);
  const git = simpleGit(repoPath);

  try {
    const rawLog = await git.raw([
      'log',
      '--pretty=format:%H|%P|%an|%ae|%ad',
      '--date=iso',
      '--no-merges'
    ]);

    const lines = rawLog.trim().split('\n');
    const commits = [];

    for (const line of lines) {
      const [hash, parents, authorName, authorEmail, date] = line.split('|');
      const parentCommits = parents ? parents.split(' ').filter(p => p) : [];

      const detailed = await git.show([hash, '--stat', '--pretty=format:', '--name-only']);
      const linesSummary = detailed.split('\n').filter(line => line.includes('changed'));

      let insertions = 0;
      let deletions = 0;

      linesSummary.forEach(line => {
        const match = line.match(/(\d+) insertions?\(\+\)/);
        if (match) insertions += parseInt(match[1]);

        const matchDel = line.match(/(\d+) deletions?\(-\)/);
        if (matchDel) deletions += parseInt(matchDel[1]);
      });

      const fileList = detailed
        .split('\n')
        .filter(line => line.trim() && !line.includes('changed') && !line.includes('|'));

      commits.push({
        repo: repoDir, // To identify which repo this belongs to
        commitId: hash,
        author: {
          name: authorName,
          email: authorEmail,
        },
        date,
        parentCommits,
        files: fileList,
        lines: {
          insertions,
          deletions,
        },
      });
    }

    if (commits.length > 0) {
      await collection.insertMany(commits);
      console.log(`✅ Inserted ${commits.length} commits from ${repoDir}`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${repoDir}:`, err.message);
  }
}

// 🏁 Run All
(async () => {
  const repoDirs = fs.readdirSync(baseRepoPath).filter(dir =>
    fs.statSync(path.join(baseRepoPath, dir)).isDirectory()
  );

  if (repoDirs.length === 0) {
    console.error('❌ No cloned repositories found.');
    return;
  }

  const collection = await connectToMongo();

  for (const repoDir of repoDirs) {
    await getCommitMetrics(repoDir, collection);
  }

  process.exit(0);
})();
