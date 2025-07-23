const fs = require('fs');
const path = require('path');

const metricsDir = path.join(__dirname, '../metrics');
const outputDir = path.join(__dirname, '../summaries');

// Ensure summary folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Get all *.json files in metrics folder
const files = fs.readdirSync(metricsDir).filter(file => file.endsWith('.json'));

files.forEach(file => {
  const inputPath = path.join(metricsDir, file);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  const authorCommits = {};

  data.forEach(commit => {
    const authorName = commit.author.name;
    if (!authorCommits[authorName]) {
      authorCommits[authorName] = 1;
    } else {
      authorCommits[authorName]++;
    }
  });

  const summaryArray = Object.entries(authorCommits).map(([author, count]) => ({
    author,
    commitCount: count
  }));

  const repoName = path.basename(file, '.json'); // Remove .json extension
  const outputPath = path.join(outputDir, `${repoName}_summary.json`);
  fs.writeFileSync(outputPath, JSON.stringify(summaryArray, null, 2));
  console.log(`📄 Summary created: ${outputPath}`);
});
