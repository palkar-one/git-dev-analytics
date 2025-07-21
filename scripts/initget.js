// scripts/initGit.js
const simpleGit = require('simple-git');
const path = require('path');

const repoDir = path.join(__dirname, '../../repos');

async function initGit() {
  const git = simpleGit(repoDir);

  try {
    await git.init();
    console.log('✅ Git initialized in', repoDir);
  } catch (err) {
    console.error('❌ Git init failed:', err.message);
  }
}

initGit();
