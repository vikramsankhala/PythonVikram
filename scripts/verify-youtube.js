#!/usr/bin/env node
/**
 * Verifies YouTube video IDs by checking oembed endpoint.
 * Usage: node scripts/verify-youtube.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// Collect unique IDs from week-resources and topics
let VIDEO_IDS = [];
try {
  const weekRes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'week-resources.json'), 'utf8'));
  weekRes.weeks.forEach(w => {
    (w.youtube || []).forEach(v => { if (v.id && !VIDEO_IDS.includes(v.id)) VIDEO_IDS.push(v.id); });
  });
} catch (e) {}
try {
  const topics = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'topics.json'), 'utf8'));
  (topics.topics || []).forEach(t => {
    (t.youtube || []).forEach(v => { if (v.id && !VIDEO_IDS.includes(v.id)) VIDEO_IDS.push(v.id); });
  });
} catch (e) {}
if (VIDEO_IDS.length === 0) {
  VIDEO_IDS = ['eWRfhZUzrAc', 'r-uOLxNrNk8', 'hDKCxebp88A', 'oXlwWbU8l2o', 'dIUTsFT2MeQ'];
}

function check(id) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(res.statusCode === 200 ? 'OK' : 'FAIL'));
    });
    req.on('error', () => resolve('FAIL'));
    req.setTimeout(5000, () => { req.destroy(); resolve('FAIL'); });
  });
}

async function main() {
  console.log(`Verifying ${VIDEO_IDS.length} unique YouTube IDs...\n`);
  let ok = 0, fail = 0;
  const failed = [];
  for (const id of VIDEO_IDS) {
    const status = await check(id);
    status === 'OK' ? ok++ : (fail++, failed.push(id));
    if (VIDEO_IDS.length <= 50) console.log(`${id}: ${status}`);
  }
  if (failed.length) console.log(`\nFailed IDs: ${failed.join(', ')}`);
  console.log(`\nResult: ${ok} OK, ${fail} FAIL`);
  process.exit(fail > ok ? 1 : 0);
}
main();
