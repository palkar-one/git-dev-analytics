// scripts/cloneRepo.js
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const repoUrl = 'https://github.com/username/repo.git';
const targetDir = path.join(__dirname, '../../repos/cloned-repo');

async function cloneRepo() {
  const git = simpleGit();

  if (fs.existsSync(targetDir)) {
    console.log('⚠️ Folder already exists. Skipping clone.');
    return;
  }

  try {
    console.log('⏳ Cloning repository...');
    await git.clone(repoUrl, targetDir);
    console.log('✅ Repo cloned to', targetDir);
  } catch (err) {
    console.error('❌ Clone failed:', err.message);
  }
}

cloneRepo();
