// scripts/deleteRepos.js
const fs = require('fs');
const path = require('path');

const cloneBasePath = path.join(__dirname, '../cloned_repos');

(() => {
  if (fs.existsSync(cloneBasePath)) {
    fs.rmSync(cloneBasePath, { recursive: true, force: true });
    console.log('🧹 Deleted cloned_repos folder.');
  } else {
    console.log('ℹ️ No cloned_repos folder to delete.');
  }
})();
