const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const repoPath = path.join(__dirname, '../cloned_repos/'); // Change repo name
const outputPath = path.join(__dirname, '../commitMetrics.json');

const git = simpleGit(repoPath);

async function getCommitMetrics() {
  try {
    const logData = await git.log({ '--shortstat': null, '--no-merges': null });
    const commits = [];

    for (const commit of logData.all) {
      const detailed = await git.show([commit.hash, '--stat', '--pretty=format:', '--name-only']);
      const linesSummary = detailed.split('\n').filter(line => line.includes('changed'));

      // Parse file changes and lines
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
        commitId: commit.hash,
        author: {
          name: commit.author_name,
          email: commit.author_email,
        },
        date: commit.date,
        parentCommits: commit.refs?.split(',') || [],
        files: fileList,
        lines: {
          insertions,
          deletions,
        },
      });
    }

    fs.writeFileSync(outputPath, JSON.stringify(commits, null, 2));
    console.log(`✅ Commit metrics saved to ${outputPath}`);
  } catch (err) {
    console.error('❌ Error extracting commit metrics:', err.message);
  }
}

getCommitMetrics();
