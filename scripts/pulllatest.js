// scripts/pullLatest.js
const simpleGit = require('simple-git');
const path = require('path');

const repoDir = path.join(__dirname, '../../repos/cloned-repo');

async function pullLatest() {
  const git = simpleGit(repoDir);

  try {
    console.log('⏳ Pulling latest changes...');
    await git.pull();
    console.log('✅ Latest code pulled.');
  } catch (err) {
    console.error('❌ Pull failed:', err.message);
  }
}

pullLatest();
