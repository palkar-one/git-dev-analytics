const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

const git = simpleGit();
const reposFilePath = path.join(__dirname, '../repos.json');
const cloneBasePath = path.join(__dirname, '../cloned_repos');

// Step 1: Check repos.json exists
if (!fs.existsSync(reposFilePath)) {
  console.error("❌ repos.json not found! Please create it with one repo URL.");
  process.exit(1);
}

const repos = JSON.parse(fs.readFileSync(reposFilePath, 'utf-8'));

if (!repos || repos.length === 0) {
  console.error("⚠️ repos.json is empty. Please add a GitHub repo URL.");
  process.exit(1);
}

// Step 2: Get the URL and extract name
const inputUrl = repos[0].url;
if (!inputUrl.startsWith('https://github.com/') || !inputUrl.endsWith('.git')) {
  console.error('❌ Invalid GitHub .git URL in repos.json');
  process.exit(1);
}

const repoName = inputUrl.split('/').pop().replace('.git', '');
const localPath = path.join(cloneBasePath, repoName);

// Step 3: If already cloned, skip
if (fs.existsSync(localPath)) {
  console.log(`⚠️ ${repoName} already cloned. Skipping...`);
  process.exit(0);
}

// Step 4: Delete old repos
if (fs.existsSync(cloneBasePath)) {
  fs.rmSync(cloneBasePath, { recursive: true, force: true });
  console.log('🧹 Removed previous cloned repos.');
}
fs.mkdirSync(cloneBasePath);

// Step 5: Clone
(async () => {
  try {
    console.log(`📥 Cloning ${inputUrl}...`);
    await git.clone(inputUrl, localPath);
    console.log(`✅ Cloned to ${localPath}`);
  } catch (err) {
    console.error(`❌ Failed to clone:`, err.message);
  }
})();
