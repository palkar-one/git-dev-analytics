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

  if (!Array.isArray(repos) || repos.length === 0) {
    console.error("❌ No repositories found in repos.json.");
    process.exit(1);
  }

  for (const repoObj of repos) {
    const url = repoObj.url;

    if (!url || !url.startsWith('https://github.com/') || !url.endsWith('.git')) {
      console.warn(`⚠️ Skipping invalid URL: ${url}`);
      continue;
    }

    // Get repo name from URL (e.g., "https://github.com/user/repo.git" → "repo")
    const repoName = url.split('/').pop().replace('.git', '');
    const localPath = path.join(cloneBasePath, repoName);

    if (fs.existsSync(localPath)) {
      console.log(`⚠️ ${repoName} already exists. Skipping...`);
      continue;
    }

    console.log(`📥 Cloning ${url} into ${repoName}...`);
    try {
      await git.clone(url, localPath);
      console.log(`✅ Cloned ${repoName} to ${localPath}`);
    } catch (err) {
      console.error(`❌ Clone failed for ${repoName}:`, err.message);
    }
  }
})();
