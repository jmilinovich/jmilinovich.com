#!/usr/bin/env node

/**
 * Refreshes public/data/contributions.json from the GitHub GraphQL API —
 * daily contribution counts from 2022-01-01 through today for @jmilinovich.
 * Feeds the homepage instrument (which falls back to date-only seeding when
 * this data goes >30 days stale — see DESIGN.md §Process).
 *
 * Requires GITHUB_TOKEN (any valid token; the data is public).
 * Run by .github/workflows/update-contributions.yml on a weekly schedule.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'data', 'contributions.json');

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('GITHUB_TOKEN is required');
  process.exit(1);
}

const LOGIN = 'jmilinovich';
const START = '2022-01-01';

async function yearChunk(fromIso, toIso) {
  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'mili-dev-contributions-updater',
    },
    body: JSON.stringify({ query, variables: { login: LOGIN, from: fromIso, to: toIso } }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount }));
}

const today = new Date().toISOString().slice(0, 10);
const byDate = new Map();
let from = new Date(`${START}T00:00:00Z`);
const end = new Date(`${today}T00:00:00Z`);
while (from < end) {
  // GraphQL caps contribution ranges at one year per query
  const to = new Date(Math.min(from.getTime() + 364 * 86400000, end.getTime()));
  const days = await yearChunk(from.toISOString(), to.toISOString());
  for (const d of days) byDate.set(d.date, d.count);
  from = new Date(to.getTime() + 86400000);
}

const data = [...byDate.entries()]
  .map(([date, count]) => ({ date, count }))
  .filter((d) => d.date >= START && d.date <= today)
  .sort((a, b) => a.date.localeCompare(b.date));

if (data.length < 1000) throw new Error(`suspiciously few days (${data.length}) — refusing to overwrite`);

let previous = '[]';
try { previous = readFileSync(OUT, 'utf8'); } catch {}
const next = JSON.stringify(data);
if (next === previous) {
  console.log('contributions.json already up to date');
} else {
  writeFileSync(OUT, next);
  const total = data.reduce((s, d) => s + d.count, 0);
  console.log(`wrote ${data.length} days (${data[0].date} → ${data[data.length - 1].date}), ${total} contributions`);
}
