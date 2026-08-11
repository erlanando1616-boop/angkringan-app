const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER; // Username GitHub Anda
const REPO = process.env.GITHUB_REPO;   // Nama Repo Anda

module.exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const date = event.queryStringParameters.date || new Date().toISOString().slice(0,10);
  const filePath = `data/transaksi-${date}.json`;

  if (event.httpMethod === 'GET') {
    try {
      const response = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: filePath,
      });
      const content = Buffer.from(response.data.content, 'base64').toString('utf8');
      return { statusCode: 200, headers, body: content };
    } catch (error) {
      // Jika file belum ada untuk tanggal tersebut, kembalikan array kosong
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const bodyData = JSON.parse(event.body);
      let sha;
      try {
        const existing = await octokit.repos.getContent({
          owner: OWNER,
          repo: REPO,
          path: filePath,
        });
        sha = existing.data.sha;
      } catch (e) {
        // File belum ada, tidak masalah (sha undefined)
      }

      await octokit.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: filePath,
        message: `Update transaksi tanggal ${date}`,
        content: Buffer.from(JSON.stringify(bodyData, null, 2)).toString('base64'),
        sha: sha,
      });

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
