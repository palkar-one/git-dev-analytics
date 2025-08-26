// scripts/triggerClone.js
const { exec } = require('child_process');
const path = require('path');

const deleteScript = path.join(__dirname, 'deleteRepos.js');
const cloneScript = path.join(__dirname, 'cloneRepos.js');

exec(`node "${deleteScript}"`, (err, stdout, stderr) => {
  if (err) {
    console.error(`❌ Delete script failed:`, stderr);
    return;
  }
  console.log(stdout);
  
  exec(`node "${cloneScript}"`, (err2, stdout2, stderr2) => {
    if (err2) {
      console.error(`❌ Clone script failed:`, stderr2);
      return;
    }
    console.log(stdout2);
  });
});
