#!/usr/bin/env node

/**
 * Fetches current GitHub star counts for all projects and updates projects.astro.
 * Set GITHUB_TOKEN env var to avoid the 60 req/hr unauthenticated rate limit.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECTS_FILE = join(__dirname, '..', 'src', 'pages', 'projects.astro');

const TOKEN = process.env.GITHUB_TOKEN;

async function getStars(owner, repo) {
  const headers = { 'User-Agent': 'mili-dev-star-updater' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!res.ok) {
    console.error(`Failed to fetch ${owner}/${repo}: ${res.status}`);
    return null;
  }
  const data = await res.json();
  return data.stargazers_count;
}

async function main() {
  const source = readFileSync(PROJECTS_FILE, 'utf-8');

  // Extract repo owner/name from each github URL in the projects array
  const urlPattern = /url:\s*"https:\/\/github\.com\/([^/]+)\/([^"]+)"/g;
  const repos = [];
  let match;
  while ((match = urlPattern.exec(source)) !== null) {
    repos.push({ owner: match[1], repo: match[2] });
  }

  // Fetch all star counts in parallel
  const starCounts = await Promise.all(
    repos.map(async ({ owner, repo }) => {
      const stars = await getStars(owner, repo);
      console.log(`  ${owner}/${repo}: ${stars ?? 'error'}`);
      return { repo, stars };
    })
  );

  // Build a map of repo name → star count
  const starsMap = Object.fromEntries(
    starCounts.filter(({ stars }) => stars !== null).map(({ repo, stars }) => [repo, stars])
  );

  // Replace each stars: N line with the fresh count
  let updated = source;
  for (const { owner, repo } of repos) {
    if (starsMap[repo] === undefined) continue;

    // Match the stars line that follows this repo's URL line
    const urlLiteral = `https://github.com/${owner}/${repo}`;
    const blockPattern = new RegExp(
      `(url:\\s*"${urlLiteral.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?stars:\\s*)\\d+`,
    );
    updated = updated.replace(blockPattern, `$1${starsMap[repo]}`);
  }

  if (updated !== source) {
    writeFileSync(PROJECTS_FILE, updated);
    console.log('\nUpdated projects.astro');
  } else {
    console.log('\nNo changes — star counts are current');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
