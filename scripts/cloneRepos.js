// scripts/cloneRepo.js
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

const git = simpleGit();
const reposPath = path.join(__dirname, '../repos.json');
const cloneBasePath = path.join(__dirname, '../cloned_repos');

(async () => {
  if (!fs.existsSync(reposPath)) {
    console.error("❌ repos.json not found.");
    process.exit(1);
  }

  const repos = JSON.parse(fs.readFileSync(reposPath, 'utf-8'));
  const inputUrl = repos[0]?.url;

  if (!inputUrl || !inputUrl.startsWith('https://github.com/') || !inputUrl.endsWith('.git')) {
    console.error("❌ Invalid or missing GitHub repo URL.");
    process.exit(1);
  }

  const repoName = inputUrl.split('/').pop().replace('.git', '');
  const localPath = path.join(cloneBasePath, repoName);

  console.log(`📥 Cloning ${inputUrl}...`);
  try {
    await git.clone(inputUrl, localPath);
    console.log(`✅ Cloned to ${localPath}`);
  } catch (err) {
    console.error(`❌ Clone failed:`, err.message);
  }
})();
