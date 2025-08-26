const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const baseRepoPath = path.join(__dirname, '../cloned_repos');
const outputBasePath = path.join(__dirname, '../metrics');

// Ensure output folder exists
if (!fs.existsSync(outputBasePath)) {
  fs.mkdirSync(outputBasePath);
}

// Get all cloned repo folders
const repoDirs = fs.readdirSync(baseRepoPath).filter(dir =>
  fs.statSync(path.join(baseRepoPath, dir)).isDirectory()
);

if (repoDirs.length === 0) {
  console.error('❌ No cloned repositories found in cloned_repos folder.');
  process.exit(1);
}

async function getCommitMetrics(repoDir) {
  const repoPath = path.join(baseRepoPath, repoDir);
  const git = simpleGit(repoPath);
  const outputPath = path.join(outputBasePath, `${repoDir}.json`);

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

      // Get detailed file changes for each commit
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

    fs.writeFileSync(outputPath, JSON.stringify(commits, null, 2));
    console.log(`✅ Metrics saved: ${outputPath}`);
  } catch (err) {
    console.error(`❌ Error processing ${repoDir}:`, err.message);
  }
}

// Run for each repo
(async () => {
  for (const repoDir of repoDirs) {
    await getCommitMetrics(repoDir);
  }
})();
