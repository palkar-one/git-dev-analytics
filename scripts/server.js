const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;

app.use(express.json());

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let collection;

client.connect().then(() => {
  const db = client.db('gitAnalytics');
  collection = db.collection('commits');
  console.log('✅ Connected to MongoDB');
});

// ✅ GET all commits (cleaned view)
app.get('/commits', async (req, res) => {
  const data = await collection.find().toArray();
  const simplified = data.map(c => ({
    id: c._id,
    commitId: c.commitId,
    author: c.author.name,
    email: c.author.email,
    date: c.date,
    filesChanged: c.files.length,
    lines: c.lines,
  }));
  res.json(simplified);
});

// ✅ GET commits grouped by author
app.get('/commits/authors', async (req, res) => {
  const commits = await collection.find().toArray();
  const authorMap = {};

  commits.forEach(commit => {
    const name = commit.author.name;
    if (!authorMap[name]) {
      authorMap[name] = {
        email: commit.author.email,
        totalCommits: 0,
        totalInsertions: 0,
        totalDeletions: 0,
      };
    }
    authorMap[name].totalCommits++;
    authorMap[name].totalInsertions += commit.lines.insertions;
    authorMap[name].totalDeletions += commit.lines.deletions;
  });

  res.json(authorMap);
});

// ✅ Search commits by author (query param)
app.get('/commits/search/author', async (req, res) => {
  const { name } = req.query;
  const commits = await collection.find({
    "author.name": { $regex: new RegExp(name, 'i') }
  }).toArray();
  res.json(commits);
});

// ✅ Get commits in a date range
app.get('/commits/date-range', async (req, res) => {
  const { start, end } = req.query;
  const commits = await collection.find({
    date: { $gte: new Date(start), $lte: new Date(end) }
  }).toArray();
  res.json(commits);
});

// ✅ Daily commit count (date-based stats)
app.get('/commits/stats/daily', async (req, res) => {
  const pipeline = [
    {
      $group: {
        _id: { $substr: ["$date", 0, 10] },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];
  const stats = await collection.aggregate(pipeline).toArray();
  res.json(stats);
});

// ✅ Top N contributors
app.get('/commits/top-contributors', async (req, res) => {
  const topN = parseInt(req.query.n) || 5;
  const pipeline = [
    {
      $group: {
        _id: "$author.name",
        email: { $first: "$author.email" },
        totalCommits: { $sum: 1 },
        insertions: { $sum: "$lines.insertions" },
        deletions: { $sum: "$lines.deletions" }
      }
    },
    { $sort: { totalCommits: -1 } },
    { $limit: topN }
  ];
  const result = await collection.aggregate(pipeline).toArray();
  res.json(result);
});

// ✅ Get files changed by each author
app.get('/commits/files-by-author', async (req, res) => {
  const pipeline = [
    {
      $group: {
        _id: "$author.name",
        files: { $push: "$files" }
      }
    }
  ];
  const result = await collection.aggregate(pipeline).toArray();
  const mapped = result.map(author => ({
    author: author._id,
    files: [...new Set(author.files.flat())]
  }));
  res.json(mapped);
});

// ✅ Hourly commit frequency
app.get('/commits/stats/hourly', async (req, res) => {
  const commits = await collection.find().toArray();
  const hours = Array(24).fill(0);

  commits.forEach(c => {
    const hour = new Date(c.date).getHours();
    hours[hour]++;
  });

  const result = hours.map((count, index) => ({ hour: `${index}:00`, commits: count }));
  res.json(result);
});

// ✅ GET a single commit by ID
app.get('/commits/:id', async (req, res) => {
  const commit = await collection.findOne({ _id: new ObjectId(req.params.id) });
  res.json(commit);
});

// ✅ PUT (replace full commit by ID)
app.put('/commits/:id', async (req, res) => {
  const updated = await collection.replaceOne(
    { _id: new ObjectId(req.params.id) },
    req.body
  );
  res.json({ message: 'Commit replaced', result: updated });
});

// ✅ PATCH (update part of commit)
app.patch('/commits/:id', async (req, res) => {
  const updated = await collection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.json({ message: 'Commit updated', result: updated });
});

// ✅ DELETE a commit
app.delete('/commits/:id', async (req, res) => {
  const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ message: 'Commit deleted', deletedCount: result.deletedCount });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
